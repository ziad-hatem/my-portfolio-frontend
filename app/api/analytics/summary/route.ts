import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { validateApiKey } from '@/lib/auth';

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
    const eventsCollection = db.collection('events');
    const viewsCollection = db.collection('views');
    const viewDetailsCollection = db.collection('view_details');

    // Get event counts by type
    const eventStats = await eventsCollection.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get view counts
    const projectViews = await viewsCollection.find({ type: 'project' }).toArray();
    const postViews = await viewsCollection.find({ type: 'post' }).toArray();

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
        const city = view.locationData.city || 'Unknown';
        const key = `${city}, ${country}`;

        if (!acc[key]) {
          acc[key] = {
            country: country,
            city: city,
            count: 0,
            countryCode: view.locationData.countryCode || '',
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
      [...viewDetails, ...await eventsCollection.find({ ipAddress: { $exists: true, $ne: null } }).toArray()]
        .filter((item: any) => item.ipAddress)
        .map((item: any) => item.ipAddress)
    );

    // Build summary
    const stats: Record<string, number> = {};
    eventStats.forEach((stat: any) => {
      stats[stat._id] = stat.count;
    });

    const summary = {
      totalEvents: eventStats.reduce((sum: number, stat: any) => sum + stat.count, 0),
      projectViews: projectViews.reduce((sum: number, p: any) => sum + (p.count || 0), 0),
      postViews: postViews.reduce((sum: number, p: any) => sum + (p.count || 0), 0),
      projectClicks: stats['project_click'] || 0,
      postClicks: stats['post_click'] || 0,
      shareClicks: stats['share_click'] || 0,
      uniqueVisitors: uniqueIPs.size,
      topProjects,
      topPosts,
      topLocations,
      generatedAt: new Date(),
    };

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to get analytics summary: ${errorMessage}` },
      { status: 500 }
    );
  }
}
