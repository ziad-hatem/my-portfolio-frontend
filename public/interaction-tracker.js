/**
 * Interaction Tracker
 * Automatically tracks page views, clicks, scrolling, and user interactions
 *
 * Usage:
 * <script src="/interaction-tracker.js"></script>
 * This will automatically initialize after fingerprint collection
 */

(function (window) {
  'use strict';

  class InteractionTracker {
    constructor() {
      this.userId = null;
      this.sessionId = null;
      this.sessionStart = Date.now();
      this.pageViewStart = Date.now();
      this.pageViewCount = 0;
      this.interactionCount = 0;
      this.maxScrollDepth = 0;
      this.trackingQueue = [];
      this.isTracking = false;
      this.excludedPaths = ['/admin', '/admin/profiles'];
    }

    /**
     * Check if current page should be tracked
     */
    shouldTrackPage() {
      const pathname = window.location.pathname;
      return !this.excludedPaths.some(excluded => pathname.startsWith(excluded));
    }

    /**
     * Initialize tracking
     */
    async init() {
      // Check if we should track this page
      if (!this.shouldTrackPage()) {
        console.log('[Tracker] Admin page detected, tracking disabled');
        return;
      }

      // Wait for fingerprint to be collected
      await this.waitForUserId();

      if (!this.userId) {
        console.log('[Tracker] No user ID available, tracking disabled');
        return;
      }

      console.log('[Tracker] Initialized for user:', this.userId);

      // Start session
      await this.startSession();

      // Track initial page view
      await this.trackPageView();

      // Setup event listeners
      this.setupEventListeners();

      // Start tracking
      this.isTracking = true;

      // Flush queue periodically
      setInterval(() => this.flushQueue(), 5000);
    }

    /**
     * Wait for user ID from fingerprint
     */
    async waitForUserId(maxWait = 10000) {
      const startTime = Date.now();

      while (!this.userId && Date.now() - startTime < maxWait) {
        this.userId = localStorage.getItem('fpUserId');
        if (this.userId) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    /**
     * Start new session
     */
    async startSession() {
      try {
        // Detect device info
        const device = {
          type: this.getDeviceType(),
          browser: this.getBrowserName(),
          os: this.getOSName(),
          screen: {
            width: screen.width,
            height: screen.height,
          },
        };

        const response = await fetch('/api/track/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.userId, device }),
        });

        if (response.ok) {
          const data = await response.json();
          this.sessionId = data.sessionId;
          console.log('[Tracker] Session started:', this.sessionId);

          // End session on page unload
          window.addEventListener('beforeunload', () => this.endSession());
        }
      } catch (error) {
        console.error('[Tracker] Session start failed:', error);
      }
    }

    /**
     * End session
     */
    async endSession() {
      if (!this.sessionId) return;

      const duration = Math.floor((Date.now() - this.sessionStart) / 1000);

      try {
        // Use sendBeacon for reliability on unload
        const data = JSON.stringify({
          userId: this.userId,
          sessionId: this.sessionId,
          duration,
          pageViewCount: this.pageViewCount,
          interactionCount: this.interactionCount,
        });

        navigator.sendBeacon(
          '/api/track/session',
          new Blob([data], { type: 'application/json' })
        );
      } catch (error) {
        console.error('[Tracker] Session end failed:', error);
      }
    }

    /**
     * Track page view
     */
    async trackPageView() {
      this.pageViewCount++;
      this.pageViewStart = Date.now();
      this.maxScrollDepth = 0;

      const pageView = {
        userId: this.userId,
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      };

      this.trackingQueue.push({
        type: 'pageview',
        data: pageView,
      });

      console.log('[Tracker] Page view tracked:', document.title);
    }

    /**
     * Track interaction
     */
    trackInteraction(type, element, data = {}) {
      if (!this.isTracking) return;

      this.interactionCount++;

      const interaction = {
        userId: this.userId,
        type,
        element,
        elementId: element?.id,
        elementClass: element?.className,
        data,
        page: window.location.pathname,
      };

      this.trackingQueue.push({
        type: 'interaction',
        data: interaction,
      });
    }

    /**
     * Flush tracking queue
     */
    async flushQueue() {
      if (this.trackingQueue.length === 0) return;

      const batch = [...this.trackingQueue];
      this.trackingQueue = [];

      for (const item of batch) {
        try {
          if (item.type === 'pageview') {
            await fetch('/api/track/pageview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
            });
          } else if (item.type === 'interaction') {
            await fetch('/api/track/interaction', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data),
            });
          }
        } catch (error) {
          console.error('[Tracker] Flush failed:', error);
        }
      }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Track clicks
      document.addEventListener('click', (e) => {
        const target = e.target;
        const element = target.closest('a, button, [data-track]');

        if (element) {
          const type = element.tagName === 'A' ? 'link_click' : 'button_click';
          const elementText =
            element.getAttribute('data-track') ||
            element.textContent?.trim() ||
            element.getAttribute('href') ||
            'Unknown';

          this.trackInteraction(type, element, {
            text: elementText.substring(0, 100),
            href: element.getAttribute('href'),
          });
        }
      });

      // Track scrolling
      let scrollTimeout;
      let maxScroll = 0;

      window.addEventListener('scroll', () => {
        const scrollPercent =
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) *
          100;

        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
          this.maxScrollDepth = Math.round(scrollPercent);
        }

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (scrollPercent > 25 && scrollPercent < 30) {
            this.trackInteraction('scroll', null, { depth: '25%' });
          } else if (scrollPercent > 50 && scrollPercent < 55) {
            this.trackInteraction('scroll', null, { depth: '50%' });
          } else if (scrollPercent > 75 && scrollPercent < 80) {
            this.trackInteraction('scroll', null, { depth: '75%' });
          } else if (scrollPercent > 95) {
            this.trackInteraction('scroll', null, { depth: '100%' });
          }
        }, 500);
      });

      // Track form submissions
      document.addEventListener('submit', (e) => {
        const form = e.target;
        this.trackInteraction('form_submit', form, {
          action: form.getAttribute('action'),
          method: form.getAttribute('method'),
        });
      });

      // Track page visibility
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.flushQueue();
        }
      });

      // Track SPA navigation (for Next.js, React Router, etc.)
      let lastPath = window.location.pathname;

      setInterval(() => {
        if (window.location.pathname !== lastPath) {
          lastPath = window.location.pathname;
          console.log('[Tracker] SPA navigation detected');

          // Check if new page should be tracked
          if (!this.shouldTrackPage()) {
            console.log('[Tracker] Navigated to excluded page, stopping tracking');
            this.isTracking = false;
            return;
          }

          // Track duration on previous page
          const duration = Math.floor((Date.now() - this.pageViewStart) / 1000);
          this.trackPageView();
        }
      }, 1000);
    }

    /**
     * Get device type
     */
    getDeviceType() {
      const ua = navigator.userAgent;
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
      }
      if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile';
      }
      return 'desktop';
    }

    /**
     * Get browser name
     */
    getBrowserName() {
      const ua = navigator.userAgent;
      if (ua.includes('Firefox/')) return 'Firefox';
      if (ua.includes('Edg/')) return 'Edge';
      if (ua.includes('Chrome/')) return 'Chrome';
      if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
      if (ua.includes('Opera/') || ua.includes('OPR/')) return 'Opera';
      return 'Unknown';
    }

    /**
     * Get OS name
     */
    getOSName() {
      const ua = navigator.userAgent;
      if (ua.includes('Windows')) return 'Windows';
      if (ua.includes('Mac OS X')) return 'macOS';
      if (ua.includes('Linux')) return 'Linux';
      if (ua.includes('Android')) return 'Android';
      if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
      return 'Unknown';
    }
  }

  // Create global instance
  window.InteractionTracker = new InteractionTracker();

  // Auto-initialize when fingerprint is collected
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => window.InteractionTracker.init(), 1000);
    });
  } else {
    setTimeout(() => window.InteractionTracker.init(), 1000);
  }
})(window);
