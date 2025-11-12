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
  userProfiles?: {
    total: number;
    activeInPeriod: number;
    activeToday: number;
    newInPeriod: number;
    totalSessions: number;
    avgSessionDuration: number;
    totalPageViews: number;
    totalInteractions: number;
    topLocations: any[];
    devices: any[];
  };
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
    userProfiles,
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

          ${userProfiles ? `
          <!-- User Profile Analytics -->
          <tr>
            <td style="padding: 30px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0;">
              <h2 style="margin: 0 0 20px; color: #1A1A2E; font-size: 20px; font-weight: 600;">👥 User Profile Analytics</h2>

              <!-- User Stats Grid -->
              <table width="100%" cellpadding="10" cellspacing="0">
                <tr>
                  <td style="background-color: #DBEAFE; border-radius: 8px; padding: 15px; text-align: center;" width="23%">
                    <div style="font-size: 12px; color: #64748B; margin-bottom: 5px;">Total Users</div>
                    <div style="font-size: 24px; font-weight: 700; color: #2563EB;">${userProfiles.total}</div>
                  </td>
                  <td width="2%"></td>
                  <td style="background-color: #D1FAE5; border-radius: 8px; padding: 15px; text-align: center;" width="23%">
                    <div style="font-size: 12px; color: #64748B; margin-bottom: 5px;">Active in Period</div>
                    <div style="font-size: 24px; font-weight: 700; color: #10B981;">${userProfiles.activeInPeriod}</div>
                  </td>
                  <td width="2%"></td>
                  <td style="background-color: #FEF3C7; border-radius: 8px; padding: 15px; text-align: center;" width="23%">
                    <div style="font-size: 12px; color: #64748B; margin-bottom: 5px;">Active Today</div>
                    <div style="font-size: 24px; font-weight: 700; color: #F59E0B;">${userProfiles.activeToday}</div>
                  </td>
                  <td width="2%"></td>
                  <td style="background-color: #E0E7FF; border-radius: 8px; padding: 15px; text-align: center;" width="23%">
                    <div style="font-size: 12px; color: #64748B; margin-bottom: 5px;">New Users</div>
                    <div style="font-size: 24px; font-weight: 700; color: #6366F1;">${userProfiles.newInPeriod}</div>
                  </td>
                </tr>
              </table>

              <!-- Sessions & Engagement -->
              <div style="margin-top: 20px; background-color: #FFF; border-radius: 8px; padding: 20px; border: 1px solid #E2E8F0;">
                <h3 style="margin: 0 0 15px; color: #1A1A2E; font-size: 16px; font-weight: 600;">📊 Sessions & Engagement</h3>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="padding: 10px; text-align: center; border-right: 1px solid #E2E8F0;" width="25%">
                      <div style="font-size: 12px; color: #64748B;">Total Sessions</div>
                      <div style="font-size: 20px; font-weight: 700; color: #00F5D4; margin-top: 5px;">${userProfiles.totalSessions}</div>
                    </td>
                    <td style="padding: 10px; text-align: center; border-right: 1px solid #E2E8F0;" width="25%">
                      <div style="font-size: 12px; color: #64748B;">Avg Duration</div>
                      <div style="font-size: 20px; font-weight: 700; color: #00F5D4; margin-top: 5px;">${Math.floor(userProfiles.avgSessionDuration / 60)}m ${userProfiles.avgSessionDuration % 60}s</div>
                    </td>
                    <td style="padding: 10px; text-align: center; border-right: 1px solid #E2E8F0;" width="25%">
                      <div style="font-size: 12px; color: #64748B;">Page Views</div>
                      <div style="font-size: 20px; font-weight: 700; color: #00F5D4; margin-top: 5px;">${userProfiles.totalPageViews}</div>
                    </td>
                    <td style="padding: 10px; text-align: center;" width="25%">
                      <div style="font-size: 12px; color: #64748B;">Interactions</div>
                      <div style="font-size: 20px; font-weight: 700; color: #00F5D4; margin-top: 5px;">${userProfiles.totalInteractions}</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Device Breakdown -->
              ${userProfiles.devices && userProfiles.devices.length > 0 ? `
              <div style="margin-top: 20px; background-color: #FFF; border-radius: 8px; padding: 20px; border: 1px solid #E2E8F0;">
                <h3 style="margin: 0 0 15px; color: #1A1A2E; font-size: 16px; font-weight: 600;">📱 Device Breakdown</h3>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    ${userProfiles.devices.map((device: any, idx: number) => `
                      <td style="padding: 15px; text-align: center; background-color: #F8FAFC; border-radius: 8px; ${idx < userProfiles.devices.length - 1 ? 'padding-right: 10px;' : ''}" width="${Math.floor(100 / userProfiles.devices.length)}%">
                        <div style="font-size: 12px; color: #64748B; text-transform: capitalize;">${device.device}</div>
                        <div style="font-size: 24px; font-weight: 700; color: #1A1A2E; margin-top: 5px;">${device.count}</div>
                      </td>
                      ${idx < userProfiles.devices.length - 1 ? '<td width="2%"></td>' : ''}
                    `).join('')}
                  </tr>
                </table>
              </div>
              ` : ''}

              <!-- Top Locations -->
              ${userProfiles.topLocations && userProfiles.topLocations.length > 0 ? `
              <div style="margin-top: 20px; background-color: #FFF; border-radius: 8px; padding: 20px; border: 1px solid #E2E8F0;">
                <h3 style="margin: 0 0 15px; color: #1A1A2E; font-size: 16px; font-weight: 600;">🌍 Top User Locations</h3>
                <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: separate; border-spacing: 0 5px;">
                  ${userProfiles.topLocations.map((location: any) => `
                    <tr>
                      <td style="padding: 10px; background-color: #F8FAFC; border-radius: 6px; font-size: 14px; color: #1A1A2E;">
                        ${location.countryCode ? getFlagEmoji(location.countryCode) : '🌐'} ${location.city}, ${location.country}
                      </td>
                      <td style="padding: 10px; background-color: #F8FAFC; border-radius: 6px; text-align: right; font-size: 14px; font-weight: 600; color: #00F5D4;">
                        ${location.count}
                      </td>
                    </tr>
                  `).join('')}
                </table>
              </div>
              ` : ''}
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
