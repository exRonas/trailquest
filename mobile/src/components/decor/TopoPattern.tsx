import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface TopoPatternProps {
  /** Stroke color for the contour lines. */
  color: string;
  opacity?: number;
}

/**
 * Topographic contour-line texture (Atlas design). Renders as an absolute
 * fill behind its parent's content — parent needs `overflow: 'hidden'`.
 * Hand-drawn-ish nested contours like a trail map's elevation rings.
 */
export function TopoPattern({ color, opacity = 0.16 }: TopoPatternProps): React.ReactElement {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 360 200" preserveAspectRatio="xMidYMid slice">
        {/* Left contour cluster */}
        <Path
          d="M-20 60 C 30 20, 90 30, 110 70 C 125 100, 95 140, 55 145 C 15 150, -25 110, -20 60 Z"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={1.4}
          fill="none"
        />
        <Path
          d="M-5 70 C 30 40, 80 45, 95 75 C 106 98, 84 126, 55 130 C 25 134, -10 105, -5 70 Z"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={1.4}
          fill="none"
        />
        <Path
          d="M12 80 C 35 60, 68 63, 78 82 C 86 97, 71 113, 51 116 C 31 119, 8 103, 12 80 Z"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={1.4}
          fill="none"
        />
        <Path
          d="M30 88 C 42 78, 58 80, 62 90 C 65 98, 56 105, 46 106 C 36 107, 27 98, 30 88 Z"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={1.4}
          fill="none"
        />
        {/* Right contour cluster */}
        <Path
          d="M240 -30 C 320 -40, 390 10, 380 70 C 372 120, 300 140, 255 110 C 210 80, 195 -18, 240 -30 Z"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={1.4}
          fill="none"
        />
        <Path
          d="M255 -12 C 315 -20, 368 18, 360 65 C 353 103, 298 118, 263 95 C 228 72, 220 -5, 255 -12 Z"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={1.4}
          fill="none"
        />
        <Path
          d="M270 6 C 315 0, 348 28, 341 62 C 335 90, 296 100, 271 82 C 246 64, 242 12, 270 6 Z"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={1.4}
          fill="none"
        />
        <Path
          d="M285 25 C 313 20, 331 38, 326 58 C 322 75, 297 81, 282 69 C 267 57, 266 30, 285 25 Z"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={1.4}
          fill="none"
        />
        {/* Loose open contour lines across the bottom */}
        <Path
          d="M-10 170 C 60 150, 140 185, 210 165 C 270 148, 330 175, 370 160"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={1.4}
          fill="none"
        />
        <Path
          d="M-10 188 C 70 170, 150 200, 225 182 C 285 168, 335 192, 370 180"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={1.4}
          fill="none"
        />
      </Svg>
    </View>
  );
}
