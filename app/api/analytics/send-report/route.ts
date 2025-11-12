import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getDatabase } from '@/lib/mongodb';
import { validateApiKey } from '@/lib/auth';
import { generateEmailTemplate } from '@/lib/email-template';
import type { UserProfile } from '@/lib/user-profile-types';

export async function POST(request: NextRequest) {
  // Validate API key
  const authResult = validateApiKey(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error?.includes('configuration') ? 500 : 401 }
    );
  }

  try {
    // Initialize Resend client at runtime
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await request.json();
    const { toEmail } = body;
    const reportType = body.reportType || 'daily';

    if (!toEmail) {
      return NextResponse.json(
        { error: 'Missing required field: toEmail' },
        { status: 400 }
      );
    }

    // Get analytics summary
    const db = await getDatabase();
    const eventsCollection = db.collection('events');
    const viewsCollection = db.collection('views');
    const viewDetailsCollection = db.collection('view_details');

    // Calculate date range based on report type
    let dateFilter = {};
    const now = new Date();
    if (reportType === 'daily') {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      dateFilter = { timestamp: { $gte: yesterday } };
    } else if (reportType === 'weekly') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { timestamp: { $gte: lastWeek } };
    } else if (reportType === 'monthly') {
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { timestamp: { $gte: lastMonth } };
    }

    // Get events for period
    const events = await eventsCollection.find(dateFilter).toArray();

    // Get view details with location data
    const viewDetails = await viewDetailsCollection.find(dateFilter).toArray();

    // Get view counts
    const projectViews = await viewsCollection.find({ type: 'project' }).toArray();
    const postViews = await viewsCollection.find({ type: 'post' }).toArray();

    // Calculate stats
    const projectViewEvents = events.filter((e: any) => e.type === 'project_view');
    const postViewEvents = events.filter((e: any) => e.type === 'post_view');
    const projectClickEvents = events.filter((e: any) => e.type === 'project_click');
    const postClickEvents = events.filter((e: any) => e.type === 'post_click');
    const shareClickEvents = events.filter((e: any) => e.type === 'share_click');

    // Top projects
    const topProjects = projectViews
      .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
      .slice(0, 5);

    // Top posts
    const topPosts = postViews
      .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
      .slice(0, 5);

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
      viewDetails
        .filter((view: any) => view.ipAddress)
        .map((view: any) => view.ipAddress)
    );

    // ===== USER PROFILE DATA =====
    const profilesCollection = db.collection<UserProfile>('user_profiles');

    // Get time windows for profile filtering
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let profileDateFilter = {};
    if (reportType === 'daily') {
      profileDateFilter = { lastSeen: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
    } else if (reportType === 'weekly') {
      profileDateFilter = { lastSeen: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (reportType === 'monthly') {
      profileDateFilter = { lastSeen: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
    }

    // Total and active users
    const totalUsers = await profilesCollection.countDocuments();
    const activeUsersInPeriod = await profilesCollection.countDocuments(profileDateFilter);
    const activeToday = await profilesCollection.countDocuments({ lastSeen: { $gte: today } });

    // New users in period
    let newUsersFilter = {};
    if (reportType === 'daily') {
      newUsersFilter = { createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
    } else if (reportType === 'weekly') {
      newUsersFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
    } else {
      newUsersFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
    }
    const newUsers = await profilesCollection.countDocuments(newUsersFilter);

    // Aggregations for period
    const profileAggregates = await profilesCollection
      .aggregate([
        { $match: profileDateFilter },
        {
          $group: {
            _id: null,
            totalPageViews: { $sum: '$totalPageViews' },
            totalInteractions: { $sum: '$totalInteractions' },
            totalSessions: { $sum: '$totalVisits' },
            avgSessionDuration: { $avg: '$averageSessionDuration' },
          },
        },
      ])
      .toArray();

    const profileTotals = profileAggregates.length > 0
      ? profileAggregates[0]
      : { totalPageViews: 0, totalInteractions: 0, totalSessions: 0, avgSessionDuration: 0 };

    // Top locations from profiles
    const locationAgg = await profilesCollection
      .aggregate([
        { $match: profileDateFilter },
        { $unwind: '$locations' },
        { $match: { 'locations.country': { $ne: 'Unknown' }, 'locations.city': { $ne: 'Local' } } },
        {
          $group: {
            _id: {
              city: '$locations.city',
              country: '$locations.country',
            },
            count: { $sum: 1 },
            countryCode: { $first: '$locations.countryCode' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ])
      .toArray();

    const topProfileLocations = locationAgg
      .filter(item => item._id && item._id.city && item._id.city !== 'Local' && item._id.country !== 'Unknown')
      .map((item) => ({
        city: item._id.city,
        country: item._id.country,
        countryCode: item.countryCode || '',
        count: item.count,
      }));

    // Device breakdown
    const deviceAgg = await profilesCollection
      .aggregate([
        { $match: profileDateFilter },
        { $unwind: '$deviceHistory' },
        {
          $group: {
            _id: '$deviceHistory.type',
            count: { $sum: '$deviceHistory.count' },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const deviceBreakdown = deviceAgg.map((item) => ({
      device: item._id || 'Unknown',
      count: item.count,
    }));

    // Generate styled HTML email
    const emailHtml = generateEmailTemplate({
      period: reportType === 'daily' ? 'Last 24 Hours' : reportType === 'weekly' ? 'Last 7 Days' : 'Last 30 Days',
      totalEvents: events.length,
      projectViews: projectViewEvents.length,
      postViews: postViewEvents.length,
      projectClicks: projectClickEvents.length,
      postClicks: postClickEvents.length,
      shareClicks: shareClickEvents.length,
      totalProjectViews: projectViews.reduce((sum: number, p: any) => sum + (p.count || 0), 0),
      totalPostViews: postViews.reduce((sum: number, p: any) => sum + (p.count || 0), 0),
      topProjects,
      topPosts,
      topLocations,
      uniqueVisitors: uniqueIPs.size,
      generatedAt: now,
      // User Profile Data
      userProfiles: {
        total: totalUsers,
        activeInPeriod: activeUsersInPeriod,
        activeToday,
        newInPeriod: newUsers,
        totalSessions: profileTotals.totalSessions,
        avgSessionDuration: Math.round(profileTotals.avgSessionDuration),
        totalPageViews: profileTotals.totalPageViews,
        totalInteractions: profileTotals.totalInteractions,
        topLocations: topProfileLocations,
        devices: deviceBreakdown,
      },
    });

    // Send email via Resend
    const result = await resend.emails.send({
      from: 'Portfolio Analytics <onboarding@resend.dev>',
      to: toEmail,
      subject: `📊 Portfolio Analytics Report - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`,
      html: emailHtml,
    });

    console.log(`📧 Analytics report sent to ${toEmail} - Email ID: ${result.data?.id}`);

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
      message: `Analytics report sent successfully to ${toEmail}`
    });
  } catch (error) {
    console.error('Error sending analytics email report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to send email report: ${errorMessage}` },
      { status: 500 }
    );
  }
}
