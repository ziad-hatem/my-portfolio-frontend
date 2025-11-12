"use client";

import { useState, useEffect } from "react";
import type { UserProfile, ProfileAnalytics } from "@/lib/user-profile-types";

export default function ProfilesAdminPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [analytics, setAnalytics] = useState<ProfileAnalytics | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchUserId, setSearchUserId] = useState("");

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load profiles
      const profilesRes = await fetch(`/api/profile?page=${page}&limit=20`);
      const profilesData = await profilesRes.json();

      if (profilesData.success) {
        setProfiles(profilesData.profiles);
        setTotalPages(profilesData.totalPages);
      }

      // Load analytics
      const analyticsRes = await fetch("/api/profile/analytics");
      const analyticsData = await analyticsRes.json();

      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchProfile = async () => {
    if (!searchUserId.trim()) return;

    try {
      const res = await fetch(
        `/api/profile?userId=${encodeURIComponent(searchUserId)}`
      );
      const data = await res.json();

      if (data.success) {
        setSelectedProfile(data.profile);
      } else {
        alert("Profile not found");
      }
    } catch (error) {
      console.error("Search failed:", error);
      alert("Search failed");
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor(
      (seconds % 3600) / 60
    )}m`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8 pt-[150px]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            User Profiles & Analytics
          </h1>
          <p className="text-gray-400">
            Track and analyze user behavior across your site
          </p>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={analytics.totalUsers.toLocaleString()}
              subtitle={`${analytics.newUsersToday} new today`}
              icon="👥"
              color="blue"
            />
            <StatCard
              title="Active Today"
              value={analytics.activeToday.toLocaleString()}
              subtitle={`${analytics.activeThisWeek} this week`}
              icon="📈"
              color="green"
            />
            <StatCard
              title="Total Page Views"
              value={analytics.totalPageViews.toLocaleString()}
              subtitle={`${analytics.totalInteractions.toLocaleString()} interactions`}
              icon="👁️"
              color="purple"
            />
            <StatCard
              title="Avg Session"
              value={formatDuration(analytics.avgSessionDuration)}
              subtitle="per session"
              icon="⏱️"
              color="orange"
            />
          </div>
        )}

        {/* Top Stats Grid */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Top Countries */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🌍</span> Top Countries
              </h3>
              <div className="space-y-2">
                {analytics.topCountries.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-300">{item.country}</span>
                    <span className="font-semibold text-blue-400">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Pages */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📄</span> Top Pages
              </h3>
              <div className="space-y-2">
                {analytics.topPages.slice(0, 5).map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span
                      className="text-gray-300 truncate max-w-[200px]"
                      title={item.page}
                    >
                      {item.page}
                    </span>
                    <span className="font-semibold text-purple-400">
                      {item.views.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Devices */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📱</span> Device Types
              </h3>
              <div className="space-y-2">
                {analytics.topDevices.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-300 capitalize">
                      {item.device}
                    </span>
                    <span className="font-semibold text-green-400">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h3 className="text-lg font-semibold mb-4">Search User Profile</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchProfile()}
              placeholder="Enter User ID..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={searchProfile}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Selected Profile Detail */}
        {selectedProfile && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  User Profile Details
                </h3>
                <p className="text-gray-400 font-mono text-sm">
                  {selectedProfile.userId}
                </p>
              </div>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <InfoCard
                label="Total Visits"
                value={selectedProfile.totalVisits.toString()}
              />
              <InfoCard
                label="Page Views"
                value={selectedProfile.totalPageViews.toString()}
              />
              <InfoCard
                label="Interactions"
                value={selectedProfile.totalInteractions.toString()}
              />
              <InfoCard
                label="Time Spent"
                value={formatDuration(selectedProfile.totalTimeSpent)}
              />
            </div>

            {/* Locations */}
            {selectedProfile.locations.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">Recent Locations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedProfile.locations.map((loc, index) => (
                    <div key={index} className="bg-gray-900 rounded-lg p-3">
                      <p className="font-semibold">
                        {loc.city}, {loc.country}
                      </p>
                      <p className="text-sm text-gray-400">{loc.isp}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Page Views */}
            {selectedProfile.pageViews.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">
                  Recent Page Views
                </h4>
                <div className="space-y-2">
                  {selectedProfile.pageViews.slice(0, 10).map((pv, index) => (
                    <div
                      key={index}
                      className="bg-gray-900 rounded-lg p-3 flex justify-between"
                    >
                      <div>
                        <p className="font-semibold">{pv.title}</p>
                        <p className="text-sm text-gray-400">{pv.pathname}</p>
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        <p>{formatDate(pv.timestamp)}</p>
                        {pv.duration && <p>{formatDuration(pv.duration)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Interactions */}
            {selectedProfile.interactions.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3">
                  Recent Interactions
                </h4>
                <div className="space-y-2">
                  {selectedProfile.interactions
                    .slice(0, 10)
                    .map((interaction, index) => (
                      <div
                        key={index}
                        className="bg-gray-900 rounded-lg p-3 flex justify-between"
                      >
                        <div>
                          <p className="font-semibold capitalize">
                            {interaction.type.replace("_", " ")}
                          </p>
                          <p className="text-sm text-gray-400">
                            {interaction.element || interaction.page}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          <p>{formatDate(interaction.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profiles List */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-2xl font-semibold mb-6">All User Profiles</h3>

          <div className="space-y-4 mb-6">
            {profiles.map((profile) => (
              <div
                key={profile.userId}
                className="bg-gray-900 rounded-lg p-4 hover:bg-gray-850 transition-colors cursor-pointer"
                onClick={() => setSelectedProfile(profile)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-mono text-sm text-blue-400 mb-1">
                      {profile.userId}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>👁️ {profile.totalPageViews} views</span>
                      <span>🖱️ {profile.totalInteractions} interactions</span>
                      <span>🔄 {profile.totalVisits} visits</span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-400">Last seen</p>
                    <p className="text-white">{formatDate(profile.lastSeen)}</p>
                  </div>
                </div>

                {profile.locations.length > 0 && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-400">Location:</span>
                    <span className="ml-2 text-white">
                      {profile.locations[profile.locations.length - 1].city},{" "}
                      {profile.locations[profile.locations.length - 1].country}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-gray-700 rounded-lg">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: string;
}) {
  const colorMap = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    green: "from-green-500/20 to-green-600/20 border-green-500/30",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    orange: "from-orange-500/20 to-orange-600/20 border-orange-500/30",
  };

  return (
    <div
      className={`bg-gradient-to-br ${
        colorMap[color as keyof typeof colorMap]
      } rounded-xl p-6 border`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-300 text-sm font-medium">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
