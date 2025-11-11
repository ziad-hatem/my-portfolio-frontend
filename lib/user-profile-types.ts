// User profile and interaction tracking types

export interface GeoLocation {
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
}

export interface PageView {
  url: string;
  pathname: string;
  title: string;
  referrer: string;
  timestamp: Date;
  duration?: number; // Time spent on page in seconds
  scrollDepth?: number; // Max scroll percentage
}

export interface Interaction {
  type: 'click' | 'form_submit' | 'button_click' | 'link_click' | 'scroll' | 'custom';
  element?: string; // Element identifier (button text, link href, etc.)
  elementId?: string;
  elementClass?: string;
  data?: Record<string, any>; // Additional data
  timestamp: Date;
  page: string; // Page where interaction happened
}

export interface Session {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  pageViews: number;
  interactions: number;
  location?: GeoLocation;
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
    screen: {
      width: number;
      height: number;
    };
  };
}

export interface UserProfile {
  _id?: string;
  userId: string; // From fingerprint
  createdAt: Date;
  lastSeen: Date;

  // Visit statistics
  totalVisits: number;
  totalPageViews: number;
  totalInteractions: number;
  totalTimeSpent: number; // in seconds

  // Location history (store last 10 locations)
  locations: GeoLocation[];

  // Session history (store last 30 sessions)
  sessions: Session[];

  // Page view history (store last 100 page views)
  pageViews: PageView[];

  // Interaction history (store last 100 interactions)
  interactions: Interaction[];

  // Aggregated data
  mostVisitedPages: Array<{ page: string; count: number }>;
  deviceHistory: Array<{ type: string; count: number }>;

  // Behavioral insights
  averageSessionDuration: number;
  averagePageViewsPerSession: number;
  bounceRate?: number;
  returnVisitor: boolean;

  // User segments/tags (for analytics)
  tags?: string[];
  notes?: string;
}

// API request/response types
export interface TrackPageViewRequest {
  userId: string;
  url: string;
  title: string;
  referrer?: string;
}

export interface TrackInteractionRequest {
  userId: string;
  type: string;
  element?: string;
  elementId?: string;
  elementClass?: string;
  data?: Record<string, any>;
  page: string;
}

export interface StartSessionRequest {
  userId: string;
  device: {
    type: string;
    browser: string;
    os: string;
    screen: { width: number; height: number };
  };
}

export interface EndSessionRequest {
  userId: string;
  sessionId: string;
  duration: number;
}

export interface UserProfileResponse {
  success: boolean;
  profile: UserProfile;
}

export interface ProfileAnalytics {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
  newUsersToday: number;
  topCountries: Array<{ country: string; count: number }>;
  topPages: Array<{ page: string; views: number }>;
  topDevices: Array<{ device: string; count: number }>;
  avgSessionDuration: number;
  totalPageViews: number;
  totalInteractions: number;
}
