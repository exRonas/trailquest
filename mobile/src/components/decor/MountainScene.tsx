import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface MountainSceneProps {
  /** Farthest ridge (lightest). */
  far: string;
  /** Middle ridge. */
  mid: string;
  /** Nearest ridge (darkest). */
  near: string;
  /** Sun disc color. */
  sun: string;
  height?: number;
}

/** Where the sun sits, as a fraction of this component's own pixel height/width
 *  — deliberately NOT computed from the ridge SVG's viewBox, since that SVG
 *  uses `slice` scaling to always fill its box (cropping whichever edge
 *  doesn't fit), which was silently cropping most of the sun off the top on
 *  short banners. Placing the sun in plain view-space keeps it clear of that
 *  crop no matter how short/wide the container is.
 *
 *  Position follows the real time of day: it rises on the left at 6:00,
 *  arcs highest at solar noon, and sets on the right by 20:00. Outside that
 *  window it parks at the horizon edge (no separate night state needed). */
function useSunPosition(): { leftPct: number; topFrac: number } {
  return useMemo(() => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const t = Math.min(1, Math.max(0, (hour - 6) / 14));
    return {
      leftPct: 8 + t * 78,
      // 0.5 (near the ridge line, at dawn/dusk) up to 0.08 (high sky at noon).
      topFrac: 0.5 - 0.42 * Math.sin(t * Math.PI),
    };
  }, []);
}

/**
 * Layered mountain-ridge illustration (Atlas design) — three overlapping
 * silhouettes with a sun that tracks the real time of day, vintage travel-
 * poster style. Stretch to the parent's width; sits at the bottom of a hero
 * header.
 */
export function MountainScene({
  far,
  mid,
  near,
  sun,
  height = 96,
}: MountainSceneProps): React.ReactElement {
  const { leftPct, topFrac } = useSunPosition();
  const sunSize = Math.max(16, Math.round(height * 0.32));

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: `${leftPct}%`,
          top: Math.round(height * topFrac - sunSize / 2),
          width: sunSize,
          height: sunSize,
          borderRadius: sunSize / 2,
          backgroundColor: sun,
          opacity: 0.9,
        }}
      />
      <Svg
        pointerEvents="none"
        width="100%"
        height={height}
        viewBox="0 0 360 60"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* Far ridge — same silhouette as before, just rescaled onto a
            flatter viewBox (was 0 0 360 96) so `slice` at the short heights
            these banners actually use doesn't crop the tallest peaks off
            the top before they're ever visible. */}
        <Path
          d="M0 41.25 L48 18.75 L82 33.75 L128 11.25 L176 36.25 L216 21.25 L262 38.75 L306 25 L360 37.5 L360 60 L0 60 Z"
          fill={far}
          fillOpacity={0.55}
        />
        {/* Middle ridge */}
        <Path
          d="M0 48.75 L36 32.5 L84 46.25 L140 25 L196 47.5 L248 32.5 L300 45 L360 31.25 L360 60 L0 60 Z"
          fill={mid}
          fillOpacity={0.75}
        />
        {/* Near ridge */}
        <Path
          d="M0 60 L20 50 L72 57.5 L132 41.25 L200 57.5 L268 45 L326 56.25 L360 48.75 L360 60 Z"
          fill={near}
        />
      </Svg>
    </View>
  );
}
