# Performance Optimization System

This directory contains utilities for detecting device performance and conditionally enabling heavy visual effects.

## Overview

The performance detection system automatically evaluates the user's device capabilities and adjusts visual effects accordingly. This ensures a smooth experience across all devices - from high-end desktops to low-power mobile devices.

## How It Works

### Performance Detection

The system evaluates multiple factors to determine device performance:

1. **Hardware Concurrency** - Number of CPU cores
2. **Device Memory** - Available RAM (if supported by browser)
3. **Device Type** - Mobile vs Desktop
4. **Browser Capabilities** - Support for backdrop-filter, SVG filters
5. **Rendering Speed** - Quick DOM manipulation test
6. **Network Speed** - Connection quality (if available)

Based on these factors, devices are classified into three performance levels:

- **High** (score ≥ 70): Full visual effects including complex SVG filters
- **Medium** (score 40-69): Lightweight CSS glass effects
- **Low** (score < 40): Minimal effects, solid backgrounds

### Usage

#### Automatic Detection in Components

The `GlassSurface` component automatically detects performance:

```tsx
import GlassSurface from "@/components/ui/GlassSurface";

function Header() {
  return (
    <GlassSurface
      opacity={0.8}
      performanceMode="auto" // Automatically detects performance
    >
      <h1>My Header</h1>
    </GlassSurface>
  );
}
```

#### Manual Performance Check

Use the `usePerformance` hook to check performance in your components:

```tsx
import { usePerformance } from "@/utils/performance/detectPerformance";

function MyComponent() {
  const { level, isMobile, score } = usePerformance();

  return (
    <div>
      {level === 'high' ? (
        <ComplexAnimation />
      ) : (
        <SimpleAnimation />
      )}
    </div>
  );
}
```

#### Helper Functions

```tsx
import {
  shouldEnableHeavyEffects,
  canHandleGlassEffects
} from "@/utils/performance/detectPerformance";

// Check if heavy animations should be enabled
if (shouldEnableHeavyEffects()) {
  // Enable GSAP animations, particles, etc.
}

// Check if complex glass effects can be used
if (canHandleGlassEffects()) {
  // Enable SVG filter-based glass effects
}
```

## Performance Levels

### High Performance
- **Criteria**: Score ≥ 70
- **Devices**: Modern desktops, high-end laptops
- **Effects**:
  - Complex SVG displacement filters
  - Multiple backdrop filters
  - Heavy GSAP animations
  - Particle effects

### Medium Performance
- **Criteria**: Score 40-69
- **Devices**: Average laptops, tablets, newer phones
- **Effects**:
  - CSS backdrop-filter only
  - Simplified animations
  - Reduced particle count

### Low Performance
- **Criteria**: Score < 40
- **Devices**: Older phones, low-end devices
- **Effects**:
  - Solid backgrounds
  - Minimal animations
  - No heavy filters

## Benefits

1. **Improved Performance**: Slow devices get lightweight effects
2. **Better User Experience**: No janky animations or lag
3. **Battery Savings**: Mobile devices use less power
4. **Automatic**: Works without user intervention
5. **Cached**: Performance detection runs once and is cached

## Development

To see performance metrics in development mode, check the browser console:

```
[GlassSurface] Performance detected: {
  level: "high",
  score: 85,
  hardwareConcurrency: 8,
  deviceMemory: 16,
  isMobile: false,
  ...
}
```

## Testing Different Performance Levels

You can manually override performance mode for testing:

```tsx
<GlassSurface performanceMode="low">
  {/* Test with low performance mode */}
</GlassSurface>

<GlassSurface performanceMode="medium">
  {/* Test with medium performance mode */}
</GlassSurface>

<GlassSurface performanceMode="high">
  {/* Test with high performance mode */}
</GlassSurface>
```

## Browser Support

The performance detection gracefully degrades:
- Modern browsers: Full detection with all metrics
- Older browsers: Basic detection with safe defaults
- Server-side: Returns "medium" as default during SSR
