/**
 * Simplified Browser Fingerprint System
 * Checks if fingerprint exists on page load, creates if needed, and tracks location
 */

(function (window) {
  "use strict";

  const STORAGE_KEY = "fpUserId";
  const ENDPOINT = "/api/fingerprint";

  /**
   * Simple hash function using SHA-256
   */
  async function hash(str) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {
      // Fallback to simple hash if crypto.subtle is not available
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return hash.toString(16);
    }
  }

  /**
   * Collect basic browser information for fingerprinting
   */
  function collectBasicInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
    };
  }

  /**
   * Generate fingerprint hash from basic info
   */
  async function generateFingerprint() {
    const basicInfo = collectBasicInfo();
    const fingerprintString = JSON.stringify(basicInfo);
    return await hash(fingerprintString);
  }

  /**
   * Check if fingerprint exists, create if not, and get location
   */
  async function initializeFingerprint() {
    ("[Fingerprint] Initializing...");

    try {
      // Check if we already have a user ID stored
      let userId = localStorage.getItem(STORAGE_KEY);

      // Generate current fingerprint hash
      const fingerprintHash = await generateFingerprint();

      // Always send to server to check/update location
      ("[Fingerprint] Sending to server...");
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fingerprint: collectBasicInfo(),
          hash: fingerprintHash,
          existingUserId: userId, // Send existing ID if we have one
        }),
      });

      if (!response.ok) {
        console.error("[Fingerprint] Server error:", response.statusText);
        return null;
      }

      const result = await response.json();

      if (result.success && result.userId) {
        // Store the user ID
        localStorage.setItem(STORAGE_KEY, result.userId);

        ("[Fingerprint] Initialized successfully");
        "[Fingerprint] User ID:", result.userId;
        "[Fingerprint] Is New User:", result.isNewUser;
        if (result.location) {
          "[Fingerprint] Location:",
            result.location.city,
            result.location.country;
        }

        return result;
      }

      return null;
    } catch (error) {
      console.error("[Fingerprint] Initialization failed:", error);
      return null;
    }
  }

  // Public API
  window.BrowserFingerprint = {
    /**
     * Initialize fingerprint system
     */
    init: initializeFingerprint,

    /**
     * Get stored user ID
     */
    getUserId() {
      return localStorage.getItem(STORAGE_KEY);
    },

    /**
     * Clear stored user ID
     */
    clearUserId() {
      localStorage.removeItem(STORAGE_KEY);
    },
  };

  // Auto-initialize on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.BrowserFingerprint.init();
    });
  } else {
    // Page already loaded, initialize immediately
    window.BrowserFingerprint.init();
  }
})(window);
