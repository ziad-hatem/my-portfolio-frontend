/**
 * Browser Fingerprint Collector
 * Production-ready client-side fingerprinting script
 *
 * Usage:
 * <script src="/fingerprint-collector.js"></script>
 * <script>
 *   BrowserFingerprint.collect().then(result => {
 *     console.log('User ID:', result.userId);
 *   });
 * </script>
 */

(function (window) {
  'use strict';

  // Check for consent and Do Not Track
  function shouldCollect() {
    // Check Do Not Track
    if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) {
      console.log('[Fingerprint] User has opted out of tracking');
      return false;
    }

    // Check stored consent (if you have a consent system)
    const consent = localStorage.getItem('fpConsent');
    if (consent === 'false') {
      console.log('[Fingerprint] User has not consented');
      return false;
    }

    return true;
  }

  class FingerprintCollector {
    constructor() {
      this.data = {};
      this.endpoint = '/api/fingerprint';
      this.collectionStart = performance.now();
    }

    /**
     * Hash a string using SHA-256
     */
    async hash(str) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
     * Collect basic browser information
     */
    getBasic() {
      return {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints || 0,

        screen: {
          width: screen.width,
          height: screen.height,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth,
        },

        window: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          outerWidth: window.outerWidth,
          outerHeight: window.outerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },

        timezone: {
          offset: new Date().getTimezoneOffset(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },

        privacy: {
          doNotTrack: navigator.doNotTrack || null,
          cookieEnabled: navigator.cookieEnabled,
        },
      };
    }

    /**
     * Generate canvas fingerprint
     */
    async getCanvas() {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        canvas.width = 240;
        canvas.height = 60;

        // Draw complex shapes and text
        ctx.textBaseline = 'top';
        ctx.font = '14px "Arial"';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);

        ctx.fillStyle = '#069';
        ctx.font = '11pt "Times New Roman"';
        ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃', 2, 15);

        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.font = '18pt Arial';
        ctx.fillText('Cwm fjordbank', 4, 45);

        // Get data URL and hash it
        const dataURL = canvas.toDataURL();
        return await this.hash(dataURL);
      } catch (e) {
        console.warn('[Fingerprint] Canvas collection failed:', e);
        return null;
      }
    }

    /**
     * Collect WebGL information
     */
    async getWebGL() {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) return null;

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

        const data = {
          vendor: gl.getParameter(gl.VENDOR),
          renderer: gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION),
          shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
          extensions: gl.getSupportedExtensions() || [],

          params: {
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
            maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
            maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
          },
        };

        if (debugInfo) {
          data.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          data.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }

        return data;
      } catch (e) {
        console.warn('[Fingerprint] WebGL collection failed:', e);
        return null;
      }
    }

    /**
     * Generate audio fingerprint
     */
    async getAudio() {
      return new Promise((resolve) => {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) {
            resolve(null);
            return;
          }

          const audioContext = new AudioContext();
          const oscillator = audioContext.createOscillator();
          const analyser = audioContext.createAnalyser();
          const gainNode = audioContext.createGain();
          const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

          // Mute the output
          gainNode.gain.value = 0;

          // Connect nodes
          oscillator.connect(analyser);
          analyser.connect(scriptProcessor);
          scriptProcessor.connect(gainNode);
          gainNode.connect(audioContext.destination);

          let processed = false;

          scriptProcessor.onaudioprocess = function (event) {
            if (processed) return;
            processed = true;

            const output = event.outputBuffer.getChannelData(0);
            let sum = 0;
            for (let i = 0; i < output.length; i++) {
              sum += Math.abs(output[i]);
            }

            // Cleanup
            oscillator.disconnect();
            scriptProcessor.disconnect();
            analyser.disconnect();
            gainNode.disconnect();
            audioContext.close();

            resolve({
              sum: sum.toString(),
              sampleRate: audioContext.sampleRate,
              maxChannelCount: audioContext.destination.maxChannelCount,
            });
          };

          oscillator.start(0);

          // Timeout after 1 second
          setTimeout(() => {
            if (!processed) {
              processed = true;
              try {
                oscillator.disconnect();
                scriptProcessor.disconnect();
                analyser.disconnect();
                gainNode.disconnect();
                audioContext.close();
              } catch (e) {
                // Ignore cleanup errors
              }
              resolve(null);
            }
          }, 1000);
        } catch (e) {
          console.warn('[Fingerprint] Audio collection failed:', e);
          resolve(null);
        }
      });
    }

    /**
     * Detect installed fonts
     */
    async getFonts() {
      try {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testFonts = [
          'Arial',
          'Verdana',
          'Times New Roman',
          'Courier New',
          'Georgia',
          'Palatino',
          'Garamond',
          'Comic Sans MS',
          'Trebuchet MS',
          'Impact',
          'Helvetica Neue',
          'Lucida Grande',
          'Tahoma',
          'Geneva',
          'Lucida Console',
          'Monaco',
          'Consolas',
        ];

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';

        canvas.width = 100;
        canvas.height = 100;

        // Get baseline measurements
        const baselines = {};
        baseFonts.forEach((baseFont) => {
          ctx.font = `${testSize} ${baseFont}`;
          baselines[baseFont] = ctx.measureText(testString).width;
        });

        // Test each font
        const detectedFonts = [];
        for (const font of testFonts) {
          let detected = false;

          for (const baseFont of baseFonts) {
            ctx.font = `${testSize} '${font}', ${baseFont}`;
            const width = ctx.measureText(testString).width;

            if (width !== baselines[baseFont]) {
              detected = true;
              break;
            }
          }

          if (detected) {
            detectedFonts.push(font);
          }
        }

        return detectedFonts;
      } catch (e) {
        console.warn('[Fingerprint] Font collection failed:', e);
        return null;
      }
    }

    /**
     * Get math fingerprint (floating point quirks)
     */
    getMath() {
      try {
        return {
          sin: Math.sin(1e10),
          cos: Math.cos(1e10),
          tan: Math.tan(-1e300),
          acos: Math.acos(0.123),
          exp: Math.exp(1),
        };
      } catch (e) {
        console.warn('[Fingerprint] Math collection failed:', e);
        return null;
      }
    }

    /**
     * Collect all fingerprint data
     */
    async collect() {
      console.log('[Fingerprint] Starting collection...');

      const [basic, canvasHash, webgl, audio, fonts, math] = await Promise.all([
        Promise.resolve(this.getBasic()),
        this.getCanvas(),
        this.getWebGL(),
        this.getAudio(),
        this.getFonts(),
        Promise.resolve(this.getMath()),
      ]);

      this.data = {
        basic,
        canvasHash,
        webgl,
        audio,
        fonts,
        math,
        collectionTime: performance.now() - this.collectionStart,
        timestamp: Date.now(),
      };

      console.log('[Fingerprint] Collection complete in', this.data.collectionTime.toFixed(2), 'ms');
      return this.data;
    }

    /**
     * Generate hash of collected data
     */
    async generateHash() {
      return await this.hash(JSON.stringify(this.data));
    }

    /**
     * Send fingerprint to server
     */
    async send() {
      try {
        const fingerprintHash = await this.generateHash();

        console.log('[Fingerprint] Sending to server...');

        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fingerprint: this.data,
            hash: fingerprintHash,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[Fingerprint] Server response:', result);

        // Store user ID in localStorage
        if (result.userId) {
          localStorage.setItem('fpUserId', result.userId);
          console.log('[Fingerprint] User ID:', result.userId);
        }

        return result;
      } catch (e) {
        console.error('[Fingerprint] Send failed:', e);
        return null;
      }
    }
  }

  // Public API
  window.BrowserFingerprint = {
    /**
     * Collect and send fingerprint
     */
    async collect() {
      if (!shouldCollect()) {
        return { success: false, reason: 'User opted out' };
      }

      const collector = new FingerprintCollector();
      await collector.collect();
      const result = await collector.send();
      return result;
    },

    /**
     * Get stored user ID
     */
    getUserId() {
      return localStorage.getItem('fpUserId');
    },

    /**
     * Clear stored user ID
     */
    clearUserId() {
      localStorage.removeItem('fpUserId');
    },
  };

  // Auto-initialize on page load (optional)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Uncomment to auto-collect on page load:
      // window.BrowserFingerprint.collect();
    });
  }
})(window);
