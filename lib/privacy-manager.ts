// Privacy and consent management utilities

/**
 * Consent preferences interface
 */
export interface ConsentPreferences {
  analytics: boolean;
  fingerprinting: boolean;
  timestamp: Date;
  version: string; // Privacy policy version
}

/**
 * Check if user has given consent for fingerprinting
 */
export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;

  // Check Do Not Track
  if (navigator.doNotTrack === '1') {
    return false;
  }

  // Check Global Privacy Control
  if ((navigator as any).globalPrivacyControl) {
    return false;
  }

  // Check stored consent
  const consentStr = localStorage.getItem('userConsent');
  if (!consentStr) {
    return false; // No consent given yet
  }

  try {
    const consent: ConsentPreferences = JSON.parse(consentStr);
    return consent.fingerprinting === true;
  } catch {
    return false;
  }
}

/**
 * Save user consent preferences
 */
export function saveConsent(preferences: ConsentPreferences): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('userConsent', JSON.stringify(preferences));
}

/**
 * Get current consent preferences
 */
export function getConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;

  const consentStr = localStorage.getItem('userConsent');
  if (!consentStr) return null;

  try {
    return JSON.parse(consentStr);
  } catch {
    return null;
  }
}

/**
 * Clear all consent preferences
 */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('userConsent');
}

/**
 * Request consent from user (returns promise that resolves when user decides)
 */
export async function requestConsent(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    // Check if already consented
    const existing = getConsent();
    if (existing) {
      resolve(existing.fingerprinting);
      return;
    }

    // Create consent banner
    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: white;
      padding: 24px;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      border-top: 2px solid #3b82f6;
    `;

    banner.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
              🔒 Privacy & Cookies
            </h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #cbd5e1;">
              We use browser fingerprinting for security and fraud prevention.
              This helps us identify suspicious activity and protect your account.
              <a href="/api/fingerprint/info" target="_blank" style="color: #60a5fa; text-decoration: underline; margin-left: 4px;">Learn more</a>
            </p>
          </div>
          <div style="display: flex; gap: 12px; flex-shrink: 0;">
            <button id="consent-decline" style="
              padding: 12px 24px;
              background: transparent;
              color: white;
              border: 1px solid #475569;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            ">
              Decline
            </button>
            <button id="consent-accept" style="
              padding: 12px 24px;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white;
              border: none;
              border-radius: 8px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
            ">
              Accept
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Add hover effects
    const acceptBtn = document.getElementById('consent-accept');
    const declineBtn = document.getElementById('consent-decline');

    acceptBtn?.addEventListener('mouseenter', () => {
      acceptBtn.style.transform = 'translateY(-2px)';
      acceptBtn.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
    });

    acceptBtn?.addEventListener('mouseleave', () => {
      acceptBtn.style.transform = 'translateY(0)';
      acceptBtn.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
    });

    declineBtn?.addEventListener('mouseenter', () => {
      declineBtn.style.background = '#1e293b';
      declineBtn.style.borderColor = '#64748b';
    });

    declineBtn?.addEventListener('mouseleave', () => {
      declineBtn.style.background = 'transparent';
      declineBtn.style.borderColor = '#475569';
    });

    // Handle accept
    document.getElementById('consent-accept')?.addEventListener('click', () => {
      const preferences: ConsentPreferences = {
        analytics: true,
        fingerprinting: true,
        timestamp: new Date(),
        version: '1.0',
      };
      saveConsent(preferences);
      banner.remove();
      resolve(true);
    });

    // Handle decline
    document.getElementById('consent-decline')?.addEventListener('click', () => {
      const preferences: ConsentPreferences = {
        analytics: false,
        fingerprinting: false,
        timestamp: new Date(),
        version: '1.0',
      };
      saveConsent(preferences);
      banner.remove();
      resolve(false);
    });
  });
}

/**
 * Anonymize fingerprint data for privacy
 */
export function anonymizeFingerprint(fingerprint: any): any {
  const anonymized = { ...fingerprint };

  // Hash sensitive data instead of storing raw values
  if (anonymized.basic?.userAgent) {
    // Keep only browser and OS, remove version details
    anonymized.basic.userAgent = simplifyUserAgent(anonymized.basic.userAgent);
  }

  // Remove exact timezone, keep only offset
  if (anonymized.basic?.timezone?.timezone) {
    delete anonymized.basic.timezone.timezone;
  }

  return anonymized;
}

/**
 * Simplify user agent to remove identifying details
 */
function simplifyUserAgent(ua: string): string {
  // Extract just browser and OS
  const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
  const osMatch = ua.match(/(Windows|Mac OS X|Linux|Android|iOS)/);

  if (browserMatch && osMatch) {
    return `${browserMatch[1]} on ${osMatch[1]}`;
  }

  return 'Unknown Browser';
}

/**
 * Check if browser has anti-tracking features enabled
 */
export function hasAntiTracking(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for various anti-tracking indicators
  const checks = [
    navigator.doNotTrack === '1',
    (navigator as any).globalPrivacyControl === true,
    (navigator as any).brave !== undefined,
    !navigator.cookieEnabled,
  ];

  return checks.some(check => check === true);
}

/**
 * Get privacy-friendly identifier (less invasive)
 */
export async function getPrivacyFriendlyId(): Promise<string> {
  if (typeof window === 'undefined') return 'server';

  // Use only basic, non-invasive attributes
  const basicInfo = {
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: screen.width,
    screenHeight: screen.height,
    timezone: new Date().getTimezoneOffset(),
  };

  const str = JSON.stringify(basicInfo);

  // Hash it
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'unknown';
  }
}
