"use client";

import React, { useState, useEffect } from "react";
import { Mail, TrendingUp, Loader2, Key, Lock, Globe } from "lucide-react";

// Helper function to convert country code to flag emoji
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function AdminAnalytics() {
  const [apiKey, setApiKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [email, setEmail] = useState("");
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("analytics_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsAuthenticated(true);
    } else {
      setShowKeyInput(true);
    }
  }, []);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    localStorage.setItem("analytics_api_key", apiKey);
    setIsAuthenticated(true);
    setShowKeyInput(false);
    setMessage("✅ API key saved successfully");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("analytics_api_key");
    setApiKey("");
    setIsAuthenticated(false);
    setShowKeyInput(true);
    setSummary(null);
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/analytics/send-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ toEmail: email, reportType }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setEmail("");
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(
        `❌ Failed to send report: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await fetch("/api/analytics/summary", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSummary(data.summary);
      } else {
        setMessage(`❌ Error fetching summary: ${data.error}`);
      }
    } catch (error) {
      setMessage(
        `❌ Failed to fetch summary: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-accent" size={32} />
            <h2 className="text-2xl text-foreground">
              Admin Analytics Dashboard
            </h2>
          </div>
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors flex items-center gap-2"
            >
              <Lock size={16} />
              Logout
            </button>
          )}
        </div>

        {/* API Key Input */}
        {showKeyInput && !isAuthenticated && (
          <div className="mb-6 bg-muted rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="text-accent" size={24} />
              <h3 className="text-xl text-foreground">Enter API Key</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              To access the analytics dashboard, please enter your Analytics API
              key. This key is stored securely in your browser.
            </p>
            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Analytics API key"
                  required
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Key size={20} />
                Save API Key
              </button>
            </form>
          </div>
        )}

        {!isAuthenticated && (
          <div className="text-center text-muted-foreground py-8">
            Please enter your API key to continue
          </div>
        )}

        {isAuthenticated && (
          <>
            {/* Summary Section */}
            <div className="mb-8">
              <button
                onClick={fetchSummary}
                disabled={loadingSummary}
                className="mb-4 px-4 py-2 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {loadingSummary ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Fetch Analytics Summary"
                )}
              </button>

              {summary && (
                <div className="bg-muted rounded-lg p-6">
                  <h3 className="text-lg text-foreground mb-4">
                    Current Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-background p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Total Events
                      </div>
                      <div className="text-2xl text-accent">
                        {summary.totalEvents}
                      </div>
                    </div>
                    <div className="bg-background p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Unique Visitors
                      </div>
                      <div className="text-2xl text-accent">
                        {summary.uniqueVisitors || 0}
                      </div>
                    </div>
                    <div className="bg-background p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Project Views
                      </div>
                      <div className="text-2xl text-accent">
                        {summary.projectViews}
                      </div>
                    </div>
                    <div className="bg-background p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Post Views
                      </div>
                      <div className="text-2xl text-accent">
                        {summary.postViews}
                      </div>
                    </div>
                    <div className="bg-background p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Project Clicks
                      </div>
                      <div className="text-2xl text-accent">
                        {summary.projectClicks}
                      </div>
                    </div>
                    <div className="bg-background p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Post Clicks
                      </div>
                      <div className="text-2xl text-accent">
                        {summary.postClicks}
                      </div>
                    </div>
                    <div className="bg-background p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Share Clicks
                      </div>
                      <div className="text-2xl text-accent">
                        {summary.shareClicks}
                      </div>
                    </div>
                  </div>

                  {summary.topProjects && summary.topProjects.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-foreground mb-2">Top Projects:</h4>
                      <ul className="space-y-1">
                        {summary.topProjects.map(
                          (project: any, idx: number) => (
                            <li
                              key={idx}
                              className="text-sm text-muted-foreground"
                            >
                              {project.itemTitle} -{" "}
                              <span className="text-accent">
                                {project.views} views
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {summary.topPosts && summary.topPosts.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-foreground mb-2">Top Posts:</h4>
                      <ul className="space-y-1">
                        {summary.topPosts.map((post: any, idx: number) => (
                          <li
                            key={idx}
                            className="text-sm text-muted-foreground"
                          >
                            {post.itemTitle} -{" "}
                            <span className="text-accent">
                              {post.views} views
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summary.topLocations && summary.topLocations.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center gap-2 mb-4">
                        <Globe className="text-accent" size={20} />
                        <h4 className="text-foreground">
                          Top Visitor Locations:
                        </h4>
                      </div>
                      <div className="bg-background rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left text-xs text-muted-foreground uppercase px-4 py-3">
                                Location
                              </th>
                              <th className="text-right text-xs text-muted-foreground uppercase px-4 py-3">
                                Visits
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {summary.topLocations.map(
                              (location: any, idx: number) => (
                                <tr
                                  key={idx}
                                  className={`border-b border-border last:border-0 ${
                                    idx % 2 === 0 ? "" : "bg-muted/30"
                                  }`}
                                >
                                  <td className="px-4 py-3 text-sm text-foreground">
                                    {location.countryCode && (
                                      <span className="mr-2 text-lg">
                                        {getFlagEmoji(location.countryCode)}
                                      </span>
                                    )}
                                    {location.city}, {location.country}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-accent text-right font-semibold">
                                    {location.count}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email Report Form */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="text-accent" size={24} />
                <h3 className="text-xl text-foreground">Send Email Report</h3>
              </div>

              <form onSubmit={handleSendReport} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm text-muted-foreground mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reportType"
                    className="block text-sm text-muted-foreground mb-2"
                  >
                    Report Type
                  </label>
                  <select
                    id="reportType"
                    value={reportType}
                    onChange={(e) =>
                      setReportType(
                        e.target.value as "daily" | "weekly" | "monthly"
                      )
                    }
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-accent"
                  >
                    <option value="daily">Daily (Last 24 Hours)</option>
                    <option value="weekly">Weekly (Last 7 Days)</option>
                    <option value="monthly">Monthly (Last 30 Days)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={20} />
                      Send Report
                    </>
                  )}
                </button>
              </form>

              {message && (
                <div
                  className={`mt-4 p-4 rounded-lg ${
                    message.startsWith("✅")
                      ? "bg-green-900/20 text-green-400"
                      : "bg-red-900/20 text-red-400"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
