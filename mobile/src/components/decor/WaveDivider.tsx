import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface WaveDividerProps {
  /** Fill of the wave — usually the color of the section BELOW the divider. */
  color: string;
  height?: number;
  /** Flip vertically for a top edge instead of a bottom edge. */
  flip?: boolean;
}

/** Soft organic wave used to separate sections in the Atlas design. */
export function WaveDivider({
  color,
  height = 24,
  flip = false,
}: WaveDividerProps): React.ReactElement {
  return (
    <Svg
      pointerEvents="none"
      width="100%"
      height={height}
      viewBox="0 0 360 24"
      preserveAspectRatio="none"
      style={flip ? { transform: [{ scaleY: -1 }] } : undefined}
    >
      <Path
        d="M0 24 L0 14 C 45 4, 90 22, 140 14 C 195 5, 240 20, 290 12 C 320 7, 345 12, 360 10 L360 24 Z"
        fill={color}
      />
    </Svg>
  );
}
