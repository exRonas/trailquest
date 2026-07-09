import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

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

/**
 * Layered mountain-ridge illustration (Atlas design) — three overlapping
 * silhouettes with a low sun, vintage travel-poster style. Stretch to the
 * parent's width; sits at the bottom of a hero header.
 */
export function MountainScene({
  far,
  mid,
  near,
  sun,
  height = 96,
}: MountainSceneProps): React.ReactElement {
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height={height}
      viewBox="0 0 360 96"
      preserveAspectRatio="xMidYMax slice"
    >
      <Circle cx={264} cy={30} r={17} fill={sun} fillOpacity={0.9} />
      {/* Far ridge */}
      <Path
        d="M0 66 L48 30 L82 54 L128 18 L176 58 L216 34 L262 62 L306 40 L360 60 L360 96 L0 96 Z"
        fill={far}
        fillOpacity={0.55}
      />
      {/* Middle ridge */}
      <Path
        d="M0 78 L36 52 L84 74 L140 40 L196 76 L248 52 L300 72 L360 50 L360 96 L0 96 Z"
        fill={mid}
        fillOpacity={0.75}
      />
      {/* Near ridge */}
      <Path
        d="M0 96 L20 80 L72 92 L132 66 L200 92 L268 72 L326 90 L360 78 L360 96 Z"
        fill={near}
      />
    </Svg>
  );
}
