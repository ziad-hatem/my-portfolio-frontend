// User Profile Management

import { getDatabase } from './mongodb';
import type {
  UserProfile,
  PageView,
  Interaction,
  Session,
  GeoLocation,
} from './user-profile-types';

/**
 * Create or get user profile
 */
export async function getOrCreateUserProfile(userId: string): Promise<UserProfile> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  let profile = await profilesCollection.findOne({ userId });

  if (!profile) {
    // Create new profile
    const newProfile: UserProfile = {
      userId,
      createdAt: new Date(),
      lastSeen: new Date(),
      totalVisits: 0,
      totalPageViews: 0,
      totalInteractions: 0,
      totalTimeSpent: 0,
      locations: [],
      sessions: [],
      pageViews: [],
      interactions: [],
      mostVisitedPages: [],
      deviceHistory: [],
      averageSessionDuration: 0,
      averagePageViewsPerSession: 0,
      returnVisitor: false,
      tags: [],
    };

    await profilesCollection.insertOne(newProfile as any);
    profile = newProfile;
  }

  return profile;
}

/**
 * Update profile location
 */
export async function addLocationToProfile(
  userId: string,
  location: GeoLocation
): Promise<void> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  await profilesCollection.updateOne(
    { userId },
    {
      $push: {
        locations: {
          $each: [location],
          $slice: -10, // Keep only last 10 locations
        },
      },
      $set: { lastSeen: new Date() },
    }
  );
}

/**
 * Track page view
 */
export async function trackPageView(
  userId: string,
  pageView: PageView
): Promise<void> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  // Add page view
  await profilesCollection.updateOne(
    { userId },
    {
      $push: {
        pageViews: {
          $each: [pageView],
          $slice: -100, // Keep only last 100 page views
        },
      },
      $inc: { totalPageViews: 1 },
      $set: { lastSeen: new Date() },
    }
  );

  // Update most visited pages
  await updateMostVisitedPages(userId);
}

/**
 * Track interaction
 */
export async function trackInteraction(
  userId: string,
  interaction: Interaction
): Promise<void> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  await profilesCollection.updateOne(
    { userId },
    {
      $push: {
        interactions: {
          $each: [interaction],
          $slice: -100, // Keep only last 100 interactions
        },
      },
      $inc: { totalInteractions: 1 },
      $set: { lastSeen: new Date() },
    }
  );
}

/**
 * Start new session
 */
export async function startSession(
  userId: string,
  session: Session
): Promise<void> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  await profilesCollection.updateOne(
    { userId },
    {
      $push: {
        sessions: {
          $each: [session],
          $slice: -30, // Keep only last 30 sessions
        },
      },
      $inc: { totalVisits: 1 },
      $set: {
        lastSeen: new Date(),
        returnVisitor: true, // If session is being started, they've visited before
      },
    }
  );

  // Update device history
  await updateDeviceHistory(userId, session.device.type);
}

/**
 * End session
 */
export async function endSession(
  userId: string,
  sessionId: string,
  duration: number,
  pageViewCount: number,
  interactionCount: number
): Promise<void> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  // Update the specific session
  await profilesCollection.updateOne(
    { userId, 'sessions.sessionId': sessionId },
    {
      $set: {
        'sessions.$.endTime': new Date(),
        'sessions.$.duration': duration,
        'sessions.$.pageViews': pageViewCount,
        'sessions.$.interactions': interactionCount,
      },
      $inc: { totalTimeSpent: duration },
    }
  );

  // Recalculate averages
  await recalculateAverages(userId);
}

/**
 * Update most visited pages
 */
async function updateMostVisitedPages(userId: string): Promise<void> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  const profile = await profilesCollection.findOne({ userId });
  if (!profile) return;

  // Count page visits
  const pageCounts = new Map<string, number>();
  profile.pageViews.forEach((pv) => {
    const count = pageCounts.get(pv.pathname) || 0;
    pageCounts.set(pv.pathname, count + 1);
  });

  // Convert to array and sort
  const mostVisited = Array.from(pageCounts.entries())
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  await profilesCollection.updateOne(
    { userId },
    { $set: { mostVisitedPages: mostVisited } }
  );
}

/**
 * Update device history
 */
async function updateDeviceHistory(userId: string, deviceType: string): Promise<void> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  const profile = await profilesCollection.findOne({ userId });
  if (!profile) return;

  // Count device types
  const deviceCounts = new Map<string, number>();
  profile.sessions.forEach((session) => {
    const count = deviceCounts.get(session.device.type) || 0;
    deviceCounts.set(session.device.type, count + 1);
  });

  // Add current device
  deviceCounts.set(deviceType, (deviceCounts.get(deviceType) || 0) + 1);

  // Convert to array
  const deviceHistory = Array.from(deviceCounts.entries()).map(([type, count]) => ({
    type,
    count,
  }));

  await profilesCollection.updateOne(
    { userId },
    { $set: { deviceHistory } }
  );
}

/**
 * Recalculate profile averages
 */
async function recalculateAverages(userId: string): Promise<void> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  const profile = await profilesCollection.findOne({ userId });
  if (!profile) return;

  // Calculate average session duration
  const sessionsWithDuration = profile.sessions.filter((s) => s.duration);
  const avgSessionDuration =
    sessionsWithDuration.length > 0
      ? sessionsWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0) /
        sessionsWithDuration.length
      : 0;

  // Calculate average page views per session
  const avgPageViewsPerSession =
    profile.sessions.length > 0 ? profile.totalPageViews / profile.sessions.length : 0;

  await profilesCollection.updateOne(
    { userId },
    {
      $set: {
        averageSessionDuration: Math.round(avgSessionDuration),
        averagePageViewsPerSession: Math.round(avgPageViewsPerSession * 10) / 10,
      },
    }
  );
}

/**
 * Get user profile by userId
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  return await profilesCollection.findOne({ userId });
}

/**
 * Get all user profiles (with pagination)
 */
export async function getAllUserProfiles(
  page: number = 1,
  limit: number = 50
): Promise<{ profiles: UserProfile[]; total: number }> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  const skip = (page - 1) * limit;

  const [profiles, total] = await Promise.all([
    profilesCollection
      .find()
      .sort({ lastSeen: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    profilesCollection.countDocuments(),
  ]);

  return { profiles, total };
}

/**
 * Add tag to user profile
 */
export async function addTagToProfile(userId: string, tag: string): Promise<void> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  await profilesCollection.updateOne(
    { userId },
    { $addToSet: { tags: tag } }
  );
}

/**
 * Remove tag from user profile
 */
export async function removeTagFromProfile(userId: string, tag: string): Promise<void> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  await profilesCollection.updateOne(
    { userId },
    { $pull: { tags: tag } }
  );
}

/**
 * Delete user profile (GDPR compliance)
 */
export async function deleteUserProfile(userId: string): Promise<void> {
  const db = await getDatabase();
  const profilesCollection = db.collection<UserProfile>('user_profiles');

  await profilesCollection.deleteOne({ userId });
}
