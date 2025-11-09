interface EmailTemplateData {
  period: string;
  totalEvents: number;
  projectViews: number;
  postViews: number;
  projectClicks: number;
  postClicks: number;
  shareClicks: number;
  totalProjectViews: number;
  totalPostViews: number;
  topProjects: any[];
  topPosts: any[];
  topLocations: any[];
  uniqueVisitors: number;
  generatedAt: Date;
}

// Helper function to convert country code to flag emoji
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function generateEmailTemplate(data: EmailTemplateData): string {
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
    topLocations,
    uniqueVisitors,
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
                    <div style="font-size: 14px; color: #64748B; margin-bottom: 5px;">Unique Visitors</div>
                    <div style="font-size: 32px; font-weight: 700; color: #10B981;">${uniqueVisitors}</div>
                  </td>
                </tr>
                <tr><td colspan="3" height="10"></td></tr>
                <tr>
                  <td style="background-color: #FEF3C7; border-radius: 8px; padding: 20px;">
                    <div style="font-size: 14px; color: #64748B; margin-bottom: 5px;">Project Views</div>
                    <div style="font-size: 32px; font-weight: 700; color: #F59E0B;">${projectViews}</div>
                  </td>
                  <td></td>
                  <td style="background-color: #F5F3FF; border-radius: 8px; padding: 20px;">
                    <div style="font-size: 14px; color: #64748B; margin-bottom: 5px;">Post Views</div>
                    <div style="font-size: 32px; font-weight: 700; color: #8B5CF6;">${postViews}</div>
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
                    <span style="color: #64748B; font-size: 14px;">Share Clicks</span>
                    <span style="float: right; color: #1A1A2E; font-weight: 600; font-size: 16px;">${shareClicks}</span>
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

          <!-- Top Locations -->
          ${topLocations.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 40px;">
              <h2 style="margin: 0 0 15px; color: #1A1A2E; font-size: 18px; font-weight: 600;">🌍 Top Locations</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                <tr style="background-color: #F8FAFC;">
                  <th style="padding: 12px; text-align: left; color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase;">Location</th>
                  <th style="padding: 12px; text-align: right; color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase;">Visits</th>
                </tr>
                ${topLocations.map((location: any, index: number) => `
                <tr style="border-top: 1px solid #E2E8F0; ${index % 2 === 0 ? 'background-color: #FFFFFF;' : 'background-color: #F8FAFC;'}">
                  <td style="padding: 12px; color: #1A1A2E; font-size: 14px;">
                    ${location.countryCode ? `<span style="margin-right: 8px; font-size: 18px;">${getFlagEmoji(location.countryCode)}</span>` : ''}
                    ${location.city}, ${location.country}
                  </td>
                  <td style="padding: 12px; text-align: right; color: #00F5D4; font-weight: 600; font-size: 14px;">${location.count}</td>
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
