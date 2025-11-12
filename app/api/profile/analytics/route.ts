// Profile analytics aggregation endpoint

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { analyticsRateLimiter } from "@/lib/rate-limit";
import type { ProfileAnalytics, UserProfile } from "@/lib/user-profile-types";

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    // @ts-ignore
    const identifier = req.ip || "anonymous";
    try {
      await analyticsRateLimiter.check(identifier, 10);
    } catch {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const db = await getDatabase();
    const profilesCollection = db.collection<UserProfile>("user_profiles");

    // Get time windows
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsers = await profilesCollection.countDocuments();

    // Active users
    const activeToday = await profilesCollection.countDocuments({
      lastSeen: { $gte: today },
    });

    const activeThisWeek = await profilesCollection.countDocuments({
      lastSeen: { $gte: thisWeek },
    });

    const activeThisMonth = await profilesCollection.countDocuments({
      lastSeen: { $gte: thisMonth },
    });

    // New users today
    const newUsersToday = await profilesCollection.countDocuments({
      createdAt: { $gte: today },
    });

    // Aggregate totals
    const aggregateResult = await profilesCollection
      .aggregate([
        {
          $group: {
            _id: null,
            totalPageViews: { $sum: "$totalPageViews" },
            totalInteractions: { $sum: "$totalInteractions" },
            avgSessionDuration: { $avg: "$averageSessionDuration" },
          },
        },
      ])
      .toArray();

    const totals =
      aggregateResult.length > 0
        ? aggregateResult[0]
        : { totalPageViews: 0, totalInteractions: 0, avgSessionDuration: 0 };

    // Top countries
    const countryAgg = await profilesCollection
      .aggregate([
        { $unwind: "$locations" },
        {
          $group: {
            _id: "$locations.country",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    const topCountries = countryAgg.map((item) => ({
      country: item._id || "Unknown",
      count: item.count,
    }));

    // Top pages
    const pageAgg = await profilesCollection
      .aggregate([
        { $unwind: "$mostVisitedPages" },
        {
          $group: {
            _id: "$mostVisitedPages.page",
            views: { $sum: "$mostVisitedPages.count" },
          },
        },
        { $sort: { views: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    const topPages = pageAgg.map((item) => ({
      page: item._id || "/",
      views: item.views,
    }));

    // Top devices
    const deviceAgg = await profilesCollection
      .aggregate([
        { $unwind: "$deviceHistory" },
        {
          $group: {
            _id: "$deviceHistory.type",
            count: { $sum: "$deviceHistory.count" },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const topDevices = deviceAgg.map((item) => ({
      device: item._id || "Unknown",
      count: item.count,
    }));

    const analytics: ProfileAnalytics = {
      totalUsers,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      newUsersToday,
      topCountries,
      topPages,
      topDevices,
      avgSessionDuration: Math.round(totals.avgSessionDuration),
      totalPageViews: totals.totalPageViews,
      totalInteractions: totals.totalInteractions,
    };

    return NextResponse.json({
      success: true,
      analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
