import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { validateApiKey } from '@/lib/auth';
import type { UserProfile } from '@/lib/user-profile-types';

/**
 * Debug endpoint to check what's in the database
 * GET /api/analytics/debug
 */
export async function GET(request: NextRequest) {
  // Validate API key
  const authResult = validateApiKey(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error?.includes('configuration') ? 500 : 401 }
    );
  }

  try {
    const db = await getDatabase();
    const profilesCollection = db.collection<UserProfile>('user_profiles');

    // Get total profiles
    const totalProfiles = await profilesCollection.countDocuments();

    // Get sample profile
    const sampleProfile = await profilesCollection.findOne();

    // Count profiles with locations
    const profilesWithLocations = await profilesCollection.countDocuments({
      locations: { $exists: true, $ne: [] }
    });

    // Get all unique countries
    const allCountries = await profilesCollection
      .aggregate([
        { $unwind: '$locations' },
        {
          $group: {
            _id: '$locations.country',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])
      .toArray();

    // Get countries excluding Unknown
    const realCountries = await profilesCollection
      .aggregate([
        { $unwind: '$locations' },
        { $match: { 'locations.country': { $ne: 'Unknown' } } },
        {
          $group: {
            _id: '$locations.country',
            count: { $sum: 1 },
            countryCode: { $first: '$locations.countryCode' }
          }
        },
        { $sort: { count: -1 } }
      ])
      .toArray();

    return NextResponse.json({
      success: true,
      debug: {
        totalProfiles,
        profilesWithLocations,
        sampleProfileLocations: sampleProfile?.locations || [],
        allCountries,
        realCountries: realCountries.length > 0 ? realCountries : 'No real countries found (all are Unknown - this is normal in development)',
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
}

/**
 * Clean up test data (removes profiles with only Unknown locations)
 * DELETE /api/analytics/debug
 */
export async function DELETE(request: NextRequest) {
  // Validate API key
  const authResult = validateApiKey(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error?.includes('configuration') ? 500 : 401 }
    );
  }

  try {
    const db = await getDatabase();
    const profilesCollection = db.collection<UserProfile>('user_profiles');

    // Delete profiles that ONLY have Unknown locations
    const result = await profilesCollection.deleteMany({
      $or: [
        { locations: [] },
        {
          locations: {
            $not: {
              $elemMatch: {
                country: { $ne: 'Unknown' }
              }
            }
          }
        }
      ]
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} test profiles with only Unknown locations`
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to clean up test data' },
      { status: 500 }
    );
  }
}
