import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { validateApiKey } from "@/lib/auth";
import type { UserProfile } from "@/lib/user-profile-types";

export async function GET(request: NextRequest) {
  // Validate API key
  const authResult = validateApiKey(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error?.includes("configuration") ? 500 : 401 }
    );
  }

  try {
    const db = await getDatabase();
    const eventsCollection = db.collection("events");
    const viewsCollection = db.collection("views");
    const viewDetailsCollection = db.collection("view_details");

    // Get event counts by type
    const eventStats = await eventsCollection
      .aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Get view counts
    const projectViews = await viewsCollection
      .find({ type: "project" })
      .toArray();
    const postViews = await viewsCollection.find({ type: "post" }).toArray();

    // Get all view details for location analysis
    const viewDetails = await viewDetailsCollection.find({}).toArray();

    // Get top viewed projects
    const topProjects = projectViews
      .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
      .slice(0, 5)
      .map((p: any) => ({
        itemId: p.itemId,
        itemTitle: p.itemTitle,
        views: p.count,
        lastViewedAt: p.lastViewedAt,
      }));

    // Get top viewed posts
    const topPosts = postViews
      .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
      .slice(0, 5)
      .map((p: any) => ({
        itemId: p.itemId,
        itemTitle: p.itemTitle,
        views: p.count,
        lastViewedAt: p.lastViewedAt,
      }));

    // Get location statistics
    const locationStats = viewDetails.reduce((acc: any, view: any) => {
      if (view.locationData && view.locationData.country) {
        const country = view.locationData.country;
        const city = view.locationData.city || "Unknown";
        const key = `${city}, ${country}`;

        if (!acc[key]) {
          acc[key] = {
            country: country,
            city: city,
            count: 0,
            countryCode: view.locationData.countryCode || "",
          };
        }
        acc[key].count++;
      }
      return acc;
    }, {});

    const topLocations = Object.values(locationStats)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // Get unique visitors by IP
    const uniqueIPs = new Set(
      [
        ...viewDetails,
        ...(await eventsCollection
          .find({ ipAddress: { $exists: true, $ne: null } })
          .toArray()),
      ]
        .filter((item: any) => item.ipAddress)
        .map((item: any) => item.ipAddress)
    );

    // ===== USER PROFILE DATA =====
    const profilesCollection = db.collection<UserProfile>("user_profiles");

    // Get time windows
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total users from profiles
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

    // New users
    const newUsersToday = await profilesCollection.countDocuments({
      createdAt: { $gte: today },
    });

    const newUsersThisWeek = await profilesCollection.countDocuments({
      createdAt: { $gte: thisWeek },
    });

    const newUsersThisMonth = await profilesCollection.countDocuments({
      createdAt: { $gte: thisMonth },
    });

    // Profile aggregations
    const profileAggregates = await profilesCollection
      .aggregate([
        {
          $group: {
            _id: null,
            totalPageViews: { $sum: "$totalPageViews" },
            totalInteractions: { $sum: "$totalInteractions" },
            totalSessions: { $sum: "$totalVisits" },
            avgSessionDuration: { $avg: "$averageSessionDuration" },
            totalTimeSpent: { $sum: "$totalTimeSpent" },
          },
        },
      ])
      .toArray();

    const profileTotals =
      profileAggregates.length > 0
        ? profileAggregates[0]
        : {
            totalPageViews: 0,
            totalInteractions: 0,
            totalSessions: 0,
            avgSessionDuration: 0,
            totalTimeSpent: 0,
          };

    // Top countries from profiles
    const countryAgg = await profilesCollection
      .aggregate([
        { $unwind: "$locations" },
        {
          $match: {
            $and: [
              { "locations.country": { $ne: "Unknown" } },
              { "locations.country": { $exists: true } },
            ],
          },
        },
        {
          $group: {
            _id: "$locations.country",
            count: { $sum: 1 },
            countryCode: { $first: "$locations.countryCode" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    console.log("[Analytics] Country aggregation result:", countryAgg);

    const topProfileCountries = countryAgg
      .filter(
        (item) => item._id && item._id !== "Unknown" && item._id !== "null"
      ) // Extra safety filter
      .map((item) => ({
        country: item._id,
        countryCode: item.countryCode || "",
        count: item.count,
      }));

    // Top cities from profiles
    const cityAgg = await profilesCollection
      .aggregate([
        { $unwind: "$locations" },
        {
          $match: {
            "locations.country": { $ne: "Unknown" },
            "locations.city": { $ne: "Local" },
          },
        },
        {
          $group: {
            _id: {
              city: "$locations.city",
              country: "$locations.country",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    console.log("[Analytics] City aggregation result:", cityAgg);

    const topProfileCities = cityAgg
      .filter(
        (item) =>
          item._id &&
          item._id.city &&
          item._id.city !== "Local" &&
          item._id.country !== "Unknown"
      )
      .map((item) => ({
        city: item._id.city,
        country: item._id.country,
        count: item.count,
      }));

    // Device types from profiles
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

    const deviceBreakdown = deviceAgg.map((item) => ({
      device: item._id || "Unknown",
      count: item.count,
    }));

    // Most visited pages from profiles
    const pagesAgg = await profilesCollection
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

    const topProfilePages = pagesAgg.map((item) => ({
      page: item._id || "/",
      views: item.views,
    }));

    // Get returning vs new visitors
    const returningVisitors = await profilesCollection.countDocuments({
      returnVisitor: true,
    });

    const bounceRate =
      totalUsers > 0
        ? ((await profilesCollection.countDocuments({ totalPageViews: 1 })) /
            totalUsers) *
          100
        : 0;

    // Build summary
    const stats: Record<string, number> = {};
    eventStats.forEach((stat: any) => {
      stats[stat._id] = stat.count;
    });

    const summary = {
      // Original analytics
      totalEvents: eventStats.reduce(
        (sum: number, stat: any) => sum + stat.count,
        0
      ),
      projectViews: projectViews.reduce(
        (sum: number, p: any) => sum + (p.count || 0),
        0
      ),
      postViews: postViews.reduce(
        (sum: number, p: any) => sum + (p.count || 0),
        0
      ),
      projectClicks: stats["project_click"] || 0,
      postClicks: stats["post_click"] || 0,
      shareClicks: stats["share_click"] || 0,
      uniqueVisitors: uniqueIPs.size,
      topProjects,
      topPosts,
      topLocations,

      // User Profile Analytics
      userProfiles: {
        total: totalUsers,
        active: {
          today: activeToday,
          thisWeek: activeThisWeek,
          thisMonth: activeThisMonth,
        },
        new: {
          today: newUsersToday,
          thisWeek: newUsersThisWeek,
          thisMonth: newUsersThisMonth,
        },
        returning: returningVisitors,
        bounceRate: Math.round(bounceRate * 10) / 10,
      },

      // Session & Interaction Data
      sessions: {
        total: profileTotals.totalSessions,
        avgDuration: Math.round(profileTotals.avgSessionDuration),
        totalTimeSpent: Math.round(profileTotals.totalTimeSpent / 3600), // Convert to hours
      },

      interactions: {
        total: profileTotals.totalInteractions,
        avgPerSession:
          profileTotals.totalSessions > 0
            ? Math.round(
                (profileTotals.totalInteractions /
                  profileTotals.totalSessions) *
                  10
              ) / 10
            : 0,
      },

      pageViews: {
        total: profileTotals.totalPageViews,
        avgPerSession:
          profileTotals.totalSessions > 0
            ? Math.round(
                (profileTotals.totalPageViews / profileTotals.totalSessions) *
                  10
              ) / 10
            : 0,
        topPages: topProfilePages,
      },

      // Location Data from Profiles
      locations: {
        topCountries: topProfileCountries,
        topCities: topProfileCities,
      },

      // Device Data
      devices: deviceBreakdown,

      generatedAt: new Date(),
    };

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Error getting analytics summary:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to get analytics summary: ${errorMessage}` },
      { status: 500 }
    );
  }
}
