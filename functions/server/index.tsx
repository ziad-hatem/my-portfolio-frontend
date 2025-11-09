import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { MongoClient } from "mongodb";
import { Resend } from "resend";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// MongoDB connection
let mongoClient: MongoClient | null = null;

async function getMongoClient() {
  if (mongoClient) return mongoClient;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  console.log('✅ Connected to MongoDB');
  return mongoClient;
}

async function getDatabase() {
  const client = await getMongoClient();
  return client.db('portfolio_analytics');
}

// Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Auth middleware for protected routes
async function requireApiKey(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  const expectedApiKey = process.env.ANALYTICS_API_KEY;

  if (!expectedApiKey) {
    console.error('❌ ANALYTICS_API_KEY environment variable is not set');
    return c.json({ error: 'Server configuration error: API key not configured' }, 500);
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    console.warn('⚠️ Unauthorized API access attempt');
    return c.json({ error: 'Unauthorized: Invalid or missing API key' }, 401);
  }

  await next();
}

// Health check endpoint
app.get("/make-server-d242963b/health", (c) => {
  return c.json({ status: "ok" });
});

// Track analytics event
app.post("/make-server-d242963b/analytics/track", async (c) => {
  try {
    const body = await c.req.json();
    const { type, itemId, itemTitle, metadata } = body;
    
    if (!type || !itemId || !itemTitle) {
      return c.json({ error: 'Missing required fields: type, itemId, itemTitle' }, 400);
    }
    
    const db = await getDatabase();
    const eventsCollection = db.collection('events');
    
    const event = {
      type,
      itemId,
      itemTitle,
      metadata: metadata || {},
      timestamp: new Date(),
      createdAt: new Date(),
    };
    
    const result = await eventsCollection.insertOne(event);
    console.log(`📊 Tracked ${type} event for ${itemTitle} (${itemId})`);
    
    return c.json({
      success: true,
      eventId: result.insertedId,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: `Failed to track event: ${errorMessage}` }, 500);
  }
});

// Increment view count for projects/posts
app.post("/make-server-d242963b/analytics/views", async (c) => {
  try {
    const body = await c.req.json();
    const { type, itemId, itemTitle } = body;
    
    if (!type || !itemId || !itemTitle) {
      return c.json({ error: 'Missing required fields: type, itemId, itemTitle' }, 400);
    }
    
    if (type !== 'project' && type !== 'post') {
      return c.json({ error: 'Type must be "project" or "post"' }, 400);
    }
    
    const db = await getDatabase();
    const viewsCollection = db.collection('views');

    // Upsert view count
    await viewsCollection.updateOne(
      { type, itemId },
      { 
        $inc: { count: 1 },
        $set: { 
          itemTitle,
          lastViewedAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
      { upsert: true }
    );
    
    // Get updated count
    const viewDoc = await viewsCollection.findOne({ type, itemId });
    
    console.log(`👁️ Incremented ${type} view for ${itemTitle} (${itemId}) - Total: ${viewDoc?.count || 1}`);
    
    return c.json({
      success: true,
      count: viewDoc?.count || 1,
      message: 'View counted successfully'
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: `Failed to increment view count: ${errorMessage}` }, 500);
  }
});

// Get analytics summary (protected)
app.get("/make-server-d242963b/analytics/summary", requireApiKey, async (c) => {
  try {
    const db = await getDatabase();
    const eventsCollection = db.collection('events');
    const viewsCollection = db.collection('views');
    
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
    
    // Get top viewed projects
    const topProjects = projectViews
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 5)
      .map(p => ({
        itemId: p.itemId,
        itemTitle: p.itemTitle,
        views: p.count,
        lastViewedAt: p.lastViewedAt,
      }));
    
    // Get top viewed posts
    const topPosts = postViews
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 5)
      .map(p => ({
        itemId: p.itemId,
        itemTitle: p.itemTitle,
        views: p.count,
        lastViewedAt: p.lastViewedAt,
      }));
    
    // Build summary
    const stats: Record<string, number> = {};
    eventStats.forEach(stat => {
      stats[stat._id] = stat.count;
    });
    
    const summary = {
      totalEvents: eventStats.reduce((sum, stat) => sum + stat.count, 0),
      projectViews: projectViews.reduce((sum, p) => sum + (p.count || 0), 0),
      postViews: postViews.reduce((sum, p) => sum + (p.count || 0), 0),
      projectClicks: stats['project_click'] || 0,
      postClicks: stats['post_click'] || 0,
      shareClicks: stats['share_click'] || 0,
      topProjects,
      topPosts,
      generatedAt: new Date(),
    };

    return c.json({ success: true, summary });
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: `Failed to get analytics summary: ${errorMessage}` }, 500);
  }
});

// Send analytics email report (protected)
app.post("/make-server-d242963b/analytics/send-report", requireApiKey, async (c) => {
  try {
    const body = await c.req.json();
    const { toEmail } = body;
    const reportType = body.reportType || 'daily';
    
    if (!toEmail) {
      return c.json({ error: 'Missing required field: toEmail' }, 400);
    }
    
    // Get analytics summary
    const db = await getDatabase();
    const eventsCollection = db.collection('events');
    const viewsCollection = db.collection('views');
    
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
    
    // Get view counts
    const projectViews = await viewsCollection.find({ type: 'project' }).toArray();
    const postViews = await viewsCollection.find({ type: 'post' }).toArray();
    
    // Calculate stats
    const projectViewEvents = events.filter(e => e.type === 'project_view');
    const postViewEvents = events.filter(e => e.type === 'post_view');
    const projectClickEvents = events.filter(e => e.type === 'project_click');
    const postClickEvents = events.filter(e => e.type === 'post_click');
    const shareClickEvents = events.filter(e => e.type === 'share_click');
    
    // Top projects
    const topProjects = projectViews
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 5);
    
    // Top posts
    const topPosts = postViews
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 5);
    
    // Generate styled HTML email
    const emailHtml = generateEmailTemplate({
      reportType,
      period: reportType === 'daily' ? 'Last 24 Hours' : reportType === 'weekly' ? 'Last 7 Days' : 'Last 30 Days',
      totalEvents: events.length,
      projectViews: projectViewEvents.length,
      postViews: postViewEvents.length,
      projectClicks: projectClickEvents.length,
      postClicks: postClickEvents.length,
      shareClicks: shareClickEvents.length,
      totalProjectViews: projectViews.reduce((sum, p) => sum + (p.count || 0), 0),
      totalPostViews: postViews.reduce((sum, p) => sum + (p.count || 0), 0),
      topProjects,
      topPosts,
      generatedAt: now,
    });
    
    // Send email via Resend
    const result = await resend.emails.send({
      from: 'Portfolio Analytics <onboarding@resend.dev>',
      to: toEmail,
      subject: `📊 Portfolio Analytics Report - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}`,
      html: emailHtml,
    });

    console.log(`📧 Analytics report sent to ${toEmail} - Email ID: ${result.data?.id}`);

    return c.json({
      success: true,
      emailId: result.data?.id,
      message: `Analytics report sent successfully to ${toEmail}`
    });
  } catch (error) {
    console.error('Error sending analytics email report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: `Failed to send email report: ${errorMessage}` }, 500);
  }
});

// Email template generator
function generateEmailTemplate(data: any): string {
  const {
    period,
    totalEvents,
    projectViews,
    postViews,
    projectClicks,
    postClicks,
    shareClicks,
    totalProjectViews,
    totalPostViews,
    topProjects,
    topPosts,
    generatedAt,
  } = data;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio Analytics Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #00F5D4; font-size: 28px; font-weight: 700;">📊 Portfolio Analytics Report</h1>
              <p style="margin: 10px 0 0; color: #F0F0F0; font-size: 16px;">${period}</p>
              <p style="margin: 5px 0 0; color: #A9A9A9; font-size: 14px;">Generated on ${generatedAt.toLocaleDateString()} at ${generatedAt.toLocaleTimeString()}</p>
            </td>
          </tr>
          
          <!-- Summary Stats -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px; color: #1A1A2E; font-size: 20px; font-weight: 600;">📈 Overview</h2>
              
              <table width="100%" cellpadding="10" cellspacing="0">
                <tr>
                  <td style="background-color: #F0F9FF; border-radius: 8px; padding: 20px; margin-bottom: 10px;" width="48%">
                    <div style="font-size: 14px; color: #64748B; margin-bottom: 5px;">Total Events</div>
                    <div style="font-size: 32px; font-weight: 700; color: #00F5D4;">${totalEvents}</div>
                  </td>
                  <td width="4%"></td>
                  <td style="background-color: #F0FDF4; border-radius: 8px; padding: 20px;" width="48%">
                    <div style="font-size: 14px; color: #64748B; margin-bottom: 5px;">Project Views</div>
                    <div style="font-size: 32px; font-weight: 700; color: #10B981;">${projectViews}</div>
                  </td>
                </tr>
                <tr><td colspan="3" height="10"></td></tr>
                <tr>
                  <td style="background-color: #FEF3C7; border-radius: 8px; padding: 20px;">
                    <div style="font-size: 14px; color: #64748B; margin-bottom: 5px;">Post Views</div>
                    <div style="font-size: 32px; font-weight: 700; color: #F59E0B;">${postViews}</div>
                  </td>
                  <td></td>
                  <td style="background-color: #F5F3FF; border-radius: 8px; padding: 20px;">
                    <div style="font-size: 14px; color: #64748B; margin-bottom: 5px;">Share Clicks</div>
                    <div style="font-size: 32px; font-weight: 700; color: #8B5CF6;">${shareClicks}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Detailed Stats -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">
                    <span style="color: #64748B; font-size: 14px;">Project Clicks</span>
                    <span style="float: right; color: #1A1A2E; font-weight: 600; font-size: 16px;">${projectClicks}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">
                    <span style="color: #64748B; font-size: 14px;">Post Clicks</span>
                    <span style="float: right; color: #1A1A2E; font-weight: 600; font-size: 16px;">${postClicks}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">
                    <span style="color: #64748B; font-size: 14px;">Total Project Views (All Time)</span>
                    <span style="float: right; color: #1A1A2E; font-weight: 600; font-size: 16px;">${totalProjectViews}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px;">
                    <span style="color: #64748B; font-size: 14px;">Total Post Views (All Time)</span>
                    <span style="float: right; color: #1A1A2E; font-weight: 600; font-size: 16px;">${totalPostViews}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Top Projects -->
          ${topProjects.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <h2 style="margin: 0 0 15px; color: #1A1A2E; font-size: 18px; font-weight: 600;">🏆 Top Projects</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #F8FAFC;">
                  <th style="padding: 12px; text-align: left; color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase;">Project</th>
                  <th style="padding: 12px; text-align: right; color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase;">Views</th>
                </tr>
                ${topProjects.map((project: any, index: number) => `
                <tr style="border-top: 1px solid #E2E8F0; ${index % 2 === 0 ? 'background-color: #FFFFFF;' : 'background-color: #F8FAFC;'}">
                  <td style="padding: 12px; color: #1A1A2E; font-size: 14px;">${project.itemTitle}</td>
                  <td style="padding: 12px; text-align: right; color: #00F5D4; font-weight: 600; font-size: 14px;">${project.count}</td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Top Posts -->
          ${topPosts.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 15px; color: #1A1A2E; font-size: 18px; font-weight: 600;">📝 Top Posts</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #F8FAFC;">
                  <th style="padding: 12px; text-align: left; color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase;">Post</th>
                  <th style="padding: 12px; text-align: right; color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase;">Views</th>
                </tr>
                ${topPosts.map((post: any, index: number) => `
                <tr style="border-top: 1px solid #E2E8F0; ${index % 2 === 0 ? 'background-color: #FFFFFF;' : 'background-color: #F8FAFC;'}">
                  <td style="padding: 12px; color: #1A1A2E; font-size: 14px;">${post.itemTitle}</td>
                  <td style="padding: 12px; text-align: right; color: #00F5D4; font-weight: 600; font-size: 14px;">${post.count}</td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 30px 40px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; color: #64748B; font-size: 14px;">This is an automated analytics report from your portfolio website.</p>
              <p style="margin: 10px 0 0; color: #A9A9A9; font-size: 12px;">Powered by Ziad Hatem Portfolio Analytics</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export default app;