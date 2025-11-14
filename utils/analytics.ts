// Analytics utility for tracking user interactions
export interface LocationData {
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

export interface TrackingEvent {
  type:
    | "project_view"
    | "post_view"
    | "project_click"
    | "post_click"
    | "share_click";
  itemId: string | number;
  itemTitle: string;
  timestamp: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
  locationData?: LocationData;
}

const STORAGE_KEY = "portfolio_analytics";
const CONSENT_KEY = "portfolio_analytics_consent";

// Fetch user's IP address
async function fetchIpAddress(): Promise<string | null> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) return null;
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.error("Failed to fetch IP address:", error);
    return null;
  }
}

// Fetch location data from IP address
async function fetchLocationData(
  ipAddress: string
): Promise<LocationData | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
    if (!response.ok) return null;
    const data = await response.json();

    if (data.status === "success") {
      return {
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
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch location data:", error);
    return null;
  }
}

export class Analytics {
  private static hasConsent(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  }

  static setConsent(accepted: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(CONSENT_KEY, accepted ? "accepted" : "rejected");

    if (!accepted) {
      // Clear all tracking data if consent is rejected
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  static getConsent(): "accepted" | "rejected" | null {
    if (typeof window === "undefined") return null;
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent as "accepted" | "rejected" | null;
  }

  private static async sendToBackend(
    endpoint: string,
    data: any
  ): Promise<void> {
    try {
      const response = await fetch(`/api${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Backend analytics error (${endpoint}):`, errorData);
      }
    } catch (error) {
      console.error(
        `Failed to send analytics to backend (${endpoint}):`,
        error
      );
    }
  }

  static async track(event: Omit<TrackingEvent, "timestamp">): Promise<void> {
    if (!this.hasConsent()) return;

    try {
      // Fetch IP and location data
      const ipAddress = await fetchIpAddress();
      let locationData: LocationData | null = null;

      if (ipAddress) {
        locationData = await fetchLocationData(ipAddress);
      }

      const events = this.getEvents();
      const newEvent: TrackingEvent = {
        ...event,
        timestamp: Date.now(),
        ipAddress: ipAddress || undefined,
        locationData: locationData || undefined,
      };

      events.push(newEvent);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

      // Send to backend
      this.sendToBackend("/analytics/track", {
        type: event.type,
        itemId: event.itemId,
        itemTitle: event.itemTitle,
        metadata: event.metadata,
        ipAddress: ipAddress || undefined,
        locationData: locationData || undefined,
      });
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  }

  static async trackView(
    type: "project" | "post",
    itemId: string | number,
    itemTitle: string
  ): Promise<void> {
    if (!this.hasConsent()) return;

    try {
      // Fetch IP and location data
      const ipAddress = await fetchIpAddress();
      let locationData: LocationData | null = null;

      if (ipAddress) {
        locationData = await fetchLocationData(ipAddress);
      }

      // Send view to backend for counting
      await this.sendToBackend("/analytics/views", {
        type,
        itemId,
        itemTitle,
        ipAddress: ipAddress || undefined,
        locationData: locationData || undefined,
      });

      `👁️ Tracked ${type} view: ${itemTitle} from ${
        locationData?.city || "Unknown"
      }, ${locationData?.country || "Unknown"}`;
    } catch (error) {
      console.error("Failed to track view:", error);
    }
  }

  static getEvents(): TrackingEvent[] {
    if (typeof window === "undefined") return [];

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to get events:", error);
      return [];
    }
  }

  static getProjectStats(projectId: string | number) {
    const events = this.getEvents();
    const projectEvents = events.filter(
      (e) =>
        e.itemId === projectId &&
        (e.type === "project_view" || e.type === "project_click")
    );

    return {
      views: projectEvents.filter((e) => e.type === "project_view").length,
      clicks: projectEvents.filter((e) => e.type === "project_click").length,
      lastViewed:
        projectEvents.length > 0
          ? new Date(Math.max(...projectEvents.map((e) => e.timestamp)))
          : null,
    };
  }

  static getPostStats(postId: string | number) {
    const events = this.getEvents();
    const postEvents = events.filter(
      (e) =>
        e.itemId === postId &&
        (e.type === "post_view" || e.type === "post_click")
    );

    return {
      views: postEvents.filter((e) => e.type === "post_view").length,
      clicks: postEvents.filter((e) => e.type === "post_click").length,
      lastViewed:
        postEvents.length > 0
          ? new Date(Math.max(...postEvents.map((e) => e.timestamp)))
          : null,
    };
  }

  static getMostViewedProjects(limit: number = 5) {
    const events = this.getEvents();
    const projectViews = events.filter((e) => e.type === "project_view");

    const viewCounts = projectViews.reduce((acc, event) => {
      acc[event.itemId] = (acc[event.itemId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(viewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id, count]) => ({
        projectId: id,
        views: count,
        title: projectViews.find((e) => e.itemId === id)?.itemTitle,
      }));
  }

  static getMostViewedPosts(limit: number = 5) {
    const events = this.getEvents();
    const postViews = events.filter((e) => e.type === "post_view");

    const viewCounts = postViews.reduce((acc, event) => {
      acc[event.itemId] = (acc[event.itemId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(viewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id, count]) => ({
        postId: id,
        views: count,
        title: postViews.find((e) => e.itemId === id)?.itemTitle,
      }));
  }

  static getAnalyticsSummary() {
    const events = this.getEvents();

    return {
      totalEvents: events.length,
      projectViews: events.filter((e) => e.type === "project_view").length,
      postViews: events.filter((e) => e.type === "post_view").length,
      projectClicks: events.filter((e) => e.type === "project_click").length,
      postClicks: events.filter((e) => e.type === "post_click").length,
      shareClicks: events.filter((e) => e.type === "share_click").length,
      mostViewedProjects: this.getMostViewedProjects(3),
      mostViewedPosts: this.getMostViewedPosts(3),
    };
  }

  static clearAll(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONSENT_KEY);
  }
}
