/**
 * Performance detection utility
 * Tests device capabilities to determine if heavy visual effects should be enabled
 */

export type PerformanceLevel = 'high' | 'medium' | 'low';

export interface PerformanceMetrics {
  level: PerformanceLevel;
  hardwareConcurrency: number;
  deviceMemory?: number;
  supportsBackdropFilter: boolean;
  supportsSVGFilters: boolean;
  isMobile: boolean;
  score: number;
}

let cachedPerformance: PerformanceMetrics | null = null;

/**
 * Detects device performance capabilities
 * Returns a performance level that can be used to conditionally enable heavy effects
 */
export function detectPerformance(): PerformanceMetrics {
  // Return cached result if available
  if (cachedPerformance) {
    return cachedPerformance;
  }

  if (typeof window === 'undefined') {
    // Server-side: return safe defaults
    return {
      level: 'medium',
      hardwareConcurrency: 4,
      supportsBackdropFilter: true,
      supportsSVGFilters: false,
      isMobile: false,
      score: 50,
    };
  }

  let score = 50; // Base score

  // 1. Check hardware concurrency (CPU cores)
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  if (hardwareConcurrency >= 8) {
    score += 20;
  } else if (hardwareConcurrency >= 4) {
    score += 10;
  } else {
    score -= 10;
  }

  // 2. Check device memory (if available)
  const deviceMemory = (navigator as any).deviceMemory;
  if (deviceMemory) {
    if (deviceMemory >= 8) {
      score += 15;
    } else if (deviceMemory >= 4) {
      score += 5;
    } else {
      score -= 15;
    }
  }

  // 3. Check if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  if (isMobile) {
    score -= 20;
  }

  // 4. Check browser capabilities
  const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
  if (!supportsBackdropFilter) {
    score -= 15;
  }

  // 5. Check SVG filter support
  const supportsSVGFilters = (() => {
    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);

    if (isWebkit || isFirefox) {
      return false;
    }

    const div = document.createElement('div');
    div.style.backdropFilter = 'url(#test-filter)';
    return div.style.backdropFilter !== '';
  })();

  if (!supportsSVGFilters) {
    score -= 10;
  }

  // 6. Performance timing test
  try {
    const startTime = performance.now();

    // Simple DOM manipulation test
    const testDiv = document.createElement('div');
    testDiv.style.transform = 'translateX(100px)';
    testDiv.style.opacity = '0.5';
    testDiv.style.filter = 'blur(10px)';
    document.body.appendChild(testDiv);

    // Force reflow
    testDiv.offsetHeight;

    document.body.removeChild(testDiv);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // If rendering takes more than 10ms, likely a slower device
    if (duration > 10) {
      score -= 10;
    } else if (duration < 2) {
      score += 10;
    }
  } catch (e) {
    // Ignore errors
  }

  // 7. Check connection speed (if available)
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    const effectiveType = connection.effectiveType;
    if (effectiveType === '4g') {
      score += 5;
    } else if (effectiveType === '3g') {
      score -= 5;
    } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
      score -= 15;
    }
  }

  // Determine performance level based on score
  let level: PerformanceLevel;
  if (score >= 70) {
    level = 'high';
  } else if (score >= 40) {
    level = 'medium';
  } else {
    level = 'low';
  }

  const metrics: PerformanceMetrics = {
    level,
    hardwareConcurrency,
    deviceMemory,
    supportsBackdropFilter,
    supportsSVGFilters,
    isMobile,
    score,
  };

  // Cache the result
  cachedPerformance = metrics;

  return metrics;
}

/**
 * React hook for accessing performance metrics
 * This hook should be used in client components to get performance information
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { level, isMobile } = usePerformance();
 *
 *   return (
 *     <div>
 *       {level === 'high' ? <HeavyAnimation /> : <LightAnimation />}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerformance(): PerformanceMetrics {
  if (typeof window === 'undefined') {
    return {
      level: 'medium',
      hardwareConcurrency: 4,
      supportsBackdropFilter: true,
      supportsSVGFilters: false,
      isMobile: false,
      score: 50,
    };
  }

  // Run detection once on client side
  return detectPerformance();
}

/**
 * Check if heavy animations should be enabled
 */
export function shouldEnableHeavyEffects(): boolean {
  const { level } = detectPerformance();
  return level === 'high' || level === 'medium';
}

/**
 * Check if the device can handle complex glass effects
 */
export function canHandleGlassEffects(): boolean {
  const { level, supportsSVGFilters } = detectPerformance();
  return level === 'high' && supportsSVGFilters;
}
