import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface StampEdgeProps {
  /** Color of the punched holes — must match the page background the stamp
   *  sits on, so the notches read as cut out of the card. */
  holeColor: string;
  holeRadius?: number;
  /** Center-to-center distance between holes. */
  gap?: number;
}

/**
 * Postage-stamp perforation: a ring of punched half-holes around the card's
 * edge (Atlas design). Render as the LAST child of a `position: relative`,
 * `overflow: 'hidden'` card so the holes sit on top of its content.
 */
export function StampEdge({
  holeColor,
  holeRadius = 3.6,
  gap = 13,
}: StampEdgeProps): React.ReactElement {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || Math.abs(size.w - width) > 1 || Math.abs(size.h - height) > 1) {
      setSize({ w: width, h: height });
    }
  };

  let holes: Array<{ x: number; y: number }> = [];
  if (size) {
    const { w, h } = size;
    const countX = Math.max(2, Math.round(w / gap));
    const countY = Math.max(2, Math.round(h / gap));
    for (let i = 0; i <= countX; i++) {
      const x = (i / countX) * w;
      holes.push({ x, y: 0 }, { x, y: h });
    }
    for (let i = 1; i < countY; i++) {
      const y = (i / countY) * h;
      holes.push({ x: 0, y }, { x: w, y });
    }
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {size ? (
        <Svg width="100%" height="100%">
          {holes.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={holeRadius} fill={holeColor} />
          ))}
        </Svg>
      ) : null}
    </View>
  );
}
