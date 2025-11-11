// Transparency and information endpoint about fingerprinting

import { NextResponse } from 'next/server';

/**
 * GET /api/fingerprint/info
 * Provides transparency information about the fingerprinting system
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    info: {
      purpose: 'Security, fraud prevention, and analytics',
      description:
        'We collect browser fingerprints to identify unique visitors, prevent fraud, and improve security.',

      dataCollected: [
        {
          category: 'Browser Configuration',
          items: [
            'User-Agent string',
            'Supported languages',
            'Platform information',
            'Installed plugins (if available)',
          ],
        },
        {
          category: 'Display & Graphics',
          items: [
            'Screen resolution',
            'Color depth',
            'Device pixel ratio',
            'Canvas rendering fingerprint',
            'WebGL renderer information',
          ],
        },
        {
          category: 'Hardware',
          items: [
            'CPU core count',
            'Device memory (if available)',
            'Graphics card model',
            'Audio hardware characteristics',
          ],
        },
        {
          category: 'System Settings',
          items: [
            'Timezone and offset',
            'Installed fonts',
            'Do Not Track preference',
            'Cookie settings',
          ],
        },
        {
          category: 'Network',
          items: ['IP address', 'Accept headers'],
        },
      ],

      howItWorks:
        'Your browser exposes various configuration details through JavaScript APIs. We combine these details to create a unique fingerprint that helps identify your device.',

      retention: '90 days from last visit',

      sharing: {
        thirdParty: 'None - all data stays on our servers',
        purposes: 'Internal security and analytics only',
      },

      privacy: {
        compliance: ['GDPR', 'CCPA'],
        yourRights: [
          'Right to access your data',
          'Right to deletion',
          'Right to opt-out',
          'Right to data portability',
        ],
      },

      security: {
        storage: 'Encrypted database',
        access: 'Restricted to authorized personnel only',
        anonymization: 'IP addresses are hashed for privacy',
      },

      optOut: {
        methods: [
          'Enable Do Not Track in your browser',
          'Use privacy-focused browser extensions',
          'Contact us to delete your data',
        ],
        contactEmail: 'privacy@example.com',
      },

      technicalDetails: {
        accuracy: '95%+ identification accuracy across sessions',
        entropy: '60-80 bits (1 in quadrillions uniqueness)',
        updateFrequency: 'Fingerprint updated on each visit',
      },

      faq: [
        {
          question: 'Can I be tracked across different browsers?',
          answer:
            'No. Fingerprints are browser-specific. Using a different browser will generate a different fingerprint.',
        },
        {
          question: 'Does incognito mode prevent fingerprinting?',
          answer:
            'Partially. While cookies are cleared, your browser configuration remains the same, so the fingerprint persists.',
        },
        {
          question: 'How can I reduce my fingerprint uniqueness?',
          answer:
            'Use privacy-focused browsers (Tor, Brave), disable JavaScript, use standard screen resolutions, or use fingerprinting protection extensions.',
        },
        {
          question: 'Is my personal information collected?',
          answer:
            'No. We only collect technical browser/device information. No names, emails, or personal data are collected through fingerprinting.',
        },
      ],

      resources: [
        {
          title: 'EFF: Browser Fingerprinting Guide',
          url: 'https://www.eff.org/deeplinks/2020/03/your-browser-fingerprint-how-it-works-and-what-you-can-do-about-it',
        },
        {
          title: 'AmIUnique: Test Your Fingerprint',
          url: 'https://amiunique.org/',
        },
      ],
    },
    timestamp: new Date().toISOString(),
  });
}
