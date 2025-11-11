'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

interface FingerprintResult {
  success: boolean;
  userId?: string;
  fingerprintId?: string;
  isNewUser?: boolean;
  confidence?: number;
  reason?: string;
}

interface FingerprintStats {
  totalFingerprints: number;
  uniqueUsers: number;
  avgConfidence: number;
  avgRevisits: number;
  suspiciousCount: number;
  lastHourCount: number;
  last24HourCount: number;
  entropy: {
    observed: string;
    theoretical: string;
    uniqueness: string;
    theoreticalUniqueness: string;
  };
}

export default function FingerprintDemo() {
  const [fingerprintResult, setFingerprintResult] = useState<FingerprintResult | null>(null);
  const [stats, setStats] = useState<FingerprintStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/fingerprint/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const collectFingerprint = async () => {
    if (typeof window === 'undefined' || !(window as any).BrowserFingerprint) {
      alert('Fingerprint collector not loaded yet. Please wait...');
      return;
    }

    setLoading(true);
    try {
      const result = await (window as any).BrowserFingerprint.collect();
      setFingerprintResult(result);
      // Reload stats to see updated numbers
      await loadStats();
    } catch (error) {
      console.error('Fingerprint collection error:', error);
      setFingerprintResult({
        success: false,
        reason: 'Collection failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFingerprint = () => {
    (window as any).BrowserFingerprint?.clearUserId();
    setFingerprintResult(null);
  };

  return (
    <>
      <Script
        src="/fingerprint-collector.js"
        onLoad={() => setScriptLoaded(true)}
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Browser Fingerprinting Demo
            </h1>
            <p className="text-gray-400 text-lg">
              Test the advanced fingerprinting system in action
            </p>
          </div>

          {/* Main Action Card */}
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">Collect Your Fingerprint</h2>
            <p className="text-gray-400 mb-6">
              Click the button below to generate a unique fingerprint based on your browser
              configuration, hardware, and settings.
            </p>

            <div className="flex gap-4 mb-6">
              <button
                onClick={collectFingerprint}
                disabled={loading || !scriptLoaded}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  loading || !scriptLoaded
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? '⏳ Collecting...' : scriptLoaded ? '🔍 Collect Fingerprint' : '⏳ Loading...'}
              </button>

              {fingerprintResult && (
                <button
                  onClick={clearFingerprint}
                  className="py-3 px-6 rounded-lg font-semibold bg-red-600 hover:bg-red-700 transition-all"
                >
                  🗑️ Clear
                </button>
              )}
            </div>

            {/* Result Display */}
            {fingerprintResult && (
              <div className={`p-6 rounded-lg ${
                fingerprintResult.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
              }`}>
                {fingerprintResult.success ? (
                  <>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      ✅ Fingerprint Collected
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm">User ID</p>
                          <p className="font-mono text-sm bg-gray-900 p-2 rounded">
                            {fingerprintResult.userId}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Fingerprint ID</p>
                          <p className="font-mono text-sm bg-gray-900 p-2 rounded truncate">
                            {fingerprintResult.fingerprintId}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Status</p>
                          <p className={`font-semibold ${
                            fingerprintResult.isNewUser ? 'text-blue-400' : 'text-green-400'
                          }`}>
                            {fingerprintResult.isNewUser ? '🆕 New User' : '👋 Returning User'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Confidence Score</p>
                          <p className="font-semibold text-yellow-400">
                            {((fingerprintResult.confidence || 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                      ❌ Collection Failed
                    </h3>
                    <p className="text-gray-400">{fingerprintResult.reason}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Fingerprints"
                value={stats.totalFingerprints.toLocaleString()}
                icon="🔢"
              />
              <StatCard
                title="Unique Users"
                value={stats.uniqueUsers.toLocaleString()}
                icon="👥"
              />
              <StatCard
                title="Avg Confidence"
                value={`${(stats.avgConfidence * 100).toFixed(1)}%`}
                icon="📊"
              />
              <StatCard
                title="Suspicious"
                value={stats.suspiciousCount.toLocaleString()}
                icon="⚠️"
              />
            </div>
          )}

          {/* Entropy Information */}
          {stats?.entropy && (
            <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6">Entropy Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-blue-400">Observed Entropy</h3>
                  <p className="text-3xl font-bold mb-2">{stats.entropy.observed} bits</p>
                  <p className="text-gray-400">Uniqueness: {stats.entropy.uniqueness}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-purple-400">Theoretical Entropy</h3>
                  <p className="text-3xl font-bold mb-2">{stats.entropy.theoretical} bits</p>
                  <p className="text-gray-400">Max uniqueness: {stats.entropy.theoreticalUniqueness}</p>
                </div>
              </div>
            </div>
          )}

          {/* What's Collected */}
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6">What Data is Collected?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DataCategory
                title="Browser & System"
                items={[
                  'User-Agent string',
                  'Platform & OS',
                  'Language preferences',
                  'Timezone',
                  'Do Not Track setting',
                ]}
              />
              <DataCategory
                title="Display & Graphics"
                items={[
                  'Screen resolution',
                  'Color depth',
                  'Device pixel ratio',
                  'WebGL renderer',
                  'Canvas fingerprint',
                ]}
              />
              <DataCategory
                title="Hardware"
                items={[
                  'CPU cores',
                  'Device memory',
                  'Graphics card model',
                  'Audio hardware',
                  'Touch support',
                ]}
              />
              <DataCategory
                title="Configuration"
                items={[
                  'Installed fonts',
                  'Audio processing',
                  'Math operations',
                  'Browser extensions (indirect)',
                ]}
              />
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
              <p className="text-sm text-gray-300">
                ℹ️ <strong>Privacy Note:</strong> No personal information (name, email, etc.) is
                collected. All data is technical browser/hardware configuration only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper Components
function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function DataCategory({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-blue-400">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-gray-400">
            <span className="text-green-500 mt-1">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
