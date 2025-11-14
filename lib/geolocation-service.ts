// IP Geolocation Service
// Uses ip-api.com (free, no API key required, 45 requests/minute)

import type { GeoLocation } from "./user-profile-types";

// Cache to avoid repeated lookups for same IP
const geoCache = new Map<string, { data: GeoLocation; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get geolocation data from IP address
 * Uses ip-api.com free service (45 requests/minute limit)
 */
export async function getLocationFromIP(
  ip: string
): Promise<GeoLocation | null> {
  // Skip local/private IPs
  if (
    !ip ||
    ip === "unknown" ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    ("[Geolocation] Local/private IP detected, returning Unknown");
    return {
      country: "Unknown",
      countryCode: "XX",
      city: "Local",
    };
  }

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Use ip-api.com free service
    ("[Geolocation] Fetching from ip-api.com...");
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 Portfolio Analytics",
        },
      }
    );

    if (!response.ok) {
      console.error("[Geolocation] API error:", response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.status === "fail") {
      console.error("[Geolocation] Failed:", data.message);
      return null;
    }

    const location: GeoLocation = {
      country: data.country,
      countryCode: data.countryCode,
      region: data.region,
      regionName: data.regionName,
      city: data.city,
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      as: data.as,
    };

    // Cache the result
    geoCache.set(ip, { data: location, timestamp: Date.now() });

    return location;
  } catch (error) {
    console.error("[Geolocation] Error:", error);
    return null;
  }
}

/**
 * Alternative: Get location using ipapi.co (100 requests/day free)
 */
export async function getLocationFromIPAlternative(
  ip: string
): Promise<GeoLocation | null> {
  if (!ip || ip === "unknown") return null;

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.error) {
      return null;
    }

    const location: GeoLocation = {
      country: data.country_name,
      countryCode: data.country_code,
      region: data.region_code,
      regionName: data.region,
      city: data.city,
      zip: data.postal,
      lat: data.latitude,
      lon: data.longitude,
      timezone: data.timezone,
      isp: data.org,
      org: data.org,
      as: data.asn,
    };

    // Cache the result
    geoCache.set(ip, { data: location, timestamp: Date.now() });

    return location;
  } catch (error) {
    console.error("Geolocation error:", error);
    return null;
  }
}

/**
 * Clear geolocation cache
 */
export function clearGeoCache(): void {
  geoCache.clear();
}

/**
 * Get cache statistics
 */
export function getGeoCacheStats() {
  return {
    size: geoCache.size,
    entries: Array.from(geoCache.entries()).map(([ip, data]) => ({
      ip,
      location: `${data.data.city}, ${data.data.country}`,
      cachedAt: new Date(data.timestamp),
    })),
  };
}
