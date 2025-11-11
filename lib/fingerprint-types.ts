// Fingerprint data structure types

export interface BasicFingerprint {
  userAgent: string;
  language: string;
  languages: string[];
  platform: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  maxTouchPoints?: number;
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    colorDepth: number;
    pixelDepth: number;
  };
  window: {
    innerWidth: number;
    innerHeight: number;
    outerWidth: number;
    outerHeight: number;
    devicePixelRatio: number;
  };
  timezone: {
    offset: number;
    timezone: string;
  };
  privacy: {
    doNotTrack: string | null;
    cookieEnabled: boolean;
  };
}

export interface WebGLFingerprint {
  vendor: string;
  renderer: string;
  version: string;
  shadingLanguageVersion: string;
  extensions: string[];
  unmaskedVendor?: string;
  unmaskedRenderer?: string;
  params: {
    maxTextureSize: number;
    maxViewportDims: number[];
    maxVertexAttribs: number;
    maxVertexTextureImageUnits: number;
    maxRenderBufferSize: number;
  };
}

export interface AudioFingerprint {
  sum: string;
  sampleRate: number;
  maxChannelCount: number;
}

export interface FingerprintData {
  basic: BasicFingerprint;
  canvasHash?: string | null;
  webgl?: WebGLFingerprint | null;
  audio?: AudioFingerprint | null;
  fonts?: string[] | null;
  math?: Record<string, number> | null;
  collectionTime: number;
  timestamp: number;
}

export interface NetworkInfo {
  ip: string;
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
}

export interface CompositeFingerprintData extends FingerprintData {
  network: NetworkInfo;
}

// Database models
export interface FingerprintRecord {
  _id?: string;
  hash: string;
  data: CompositeFingerprintData;
  userId: string;
  createdAt: Date;
  lastSeen: Date;
  seenCount: number;
  confidence: number;
  suspicious?: boolean;
  suspiciousReasons?: string[];
}

export interface UserRecord {
  _id?: string;
  userId: string;
  createdAt: Date;
  lastSeen: Date;
  accountId?: string;
}

// API request/response types
export interface FingerprintRequest {
  fingerprint: FingerprintData;
  hash: string;
}

export interface FingerprintResponse {
  success: boolean;
  userId: string;
  fingerprintId: string;
  isNewUser: boolean;
  confidence: number;
}

// Matching types
export interface WeightedAttribute {
  key: string;
  weight: number;
  compareFn: (a: any, b: any) => number;
}

export interface MatchResult {
  userId: string;
  confidence: number;
  method: 'exact_fingerprint' | 'fuzzy_fingerprint' | 'ip_recent' | 'new_user';
}

// Analytics types
export interface FingerprintStats {
  totalFingerprints: number;
  uniqueUsers: number;
  avgConfidence: number;
  avgRevisits: number;
  suspiciousCount: number;
  lastHourCount: number;
  last24HourCount: number;
}

export interface EntropyAttribute {
  name: string;
  cardinality: number;
  distribution?: number[];
}

// Behavioral fingerprinting types
export interface BehavioralMetrics {
  mouseSpeedAvg: number;
  mouseSpeedVariance: number;
  typingIntervalAvg: number;
  scrollSpeedAvg: number;
  movementCount: number;
  keystrokeCount: number;
  scrollCount: number;
}
