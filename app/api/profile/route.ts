// User profile API endpoints

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProfile,
  getAllUserProfiles,
  addTagToProfile,
  removeTagFromProfile,
  deleteUserProfile,
} from '@/lib/user-profile-manager';
import { getDatabase } from '@/lib/mongodb';
import { analyticsRateLimiter } from '@/lib/rate-limit';
import type { ProfileAnalytics } from '@/lib/user-profile-types';

/**
 * GET /api/profile?userId=xxx
 * OR
 * GET /api/profile?page=1&limit=50
 * Get user profile or list all profiles
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const identifier = req.ip || 'anonymous';
    try {
      await analyticsRateLimiter.check(identifier, 20);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (userId) {
      // Get specific user profile
      const profile = await getUserProfile(userId);

      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, profile });
    } else {
      // Get all profiles with pagination
      const { profiles, total } = await getAllUserProfiles(page, limit);

      return NextResponse.json({
        success: true,
        profiles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }
  } catch (error) {
    console.error('Profile retrieval error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile
 * Add tag to profile
 */
export async function POST(req: NextRequest) {
  try {
    const identifier = req.ip || 'anonymous';
    try {
      await analyticsRateLimiter.check(identifier, 10);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { userId, tag } = body;

    if (!userId || !tag) {
      return NextResponse.json(
        { success: false, error: 'userId and tag are required' },
        { status: 400 }
      );
    }

    await addTagToProfile(userId, tag);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add tag error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile?userId=xxx&tag=yyy
 * Delete profile or remove tag
 */
export async function DELETE(req: NextRequest) {
  try {
    const identifier = req.ip || 'anonymous';
    try {
      await analyticsRateLimiter.check(identifier, 10);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const tag = searchParams.get('tag');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    if (tag) {
      // Remove tag
      await removeTagFromProfile(userId, tag);
      return NextResponse.json({ success: true, message: 'Tag removed' });
    } else {
      // Delete entire profile
      await deleteUserProfile(userId);
      return NextResponse.json({ success: true, message: 'Profile deleted' });
    }
  } catch (error) {
    console.error('Profile delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
