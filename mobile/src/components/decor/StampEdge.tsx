import React from 'react';
import { StyleSheet, View } from 'react-native';

interface StampEdgeProps {
  /** Color of the punched holes — must match the page background the stamp
   *  sits on, so the notches read as cut out of the card. */
  holeColor: string;
  holeSize?: number;
  /** How many holes per edge — same count top/bottom and left/right. */
  count?: number;
}

const H_DOTS = 12;
const V_DOTS = 7;

function Dot({ color, size }: { color: string; size: number }): React.ReactElement {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

/**
 * Postage-stamp perforation: a ring of punched half-holes around the card's
 * edge (Atlas design), built purely from flexbox — no measurement, no state,
 * so it can't cause the re-render churn a `onLayout`-driven version would
 * inside a virtualized list. Render as the LAST child of a `position:
 * relative`, `overflow: 'hidden'` card so the holes sit on top of its content.
 */
export function StampEdge({
  holeColor,
  holeSize = 7,
  count = H_DOTS,
}: StampEdgeProps): React.ReactElement {
  const hCount = count;
  const vCount = Math.round((count * V_DOTS) / H_DOTS);
  const half = holeSize / 2;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.row, { top: -half }]}>
        {Array.from({ length: hCount }).map((_, i) => (
          <Dot key={i} color={holeColor} size={holeSize} />
        ))}
      </View>
      <View style={[styles.row, { bottom: -half }]}>
        {Array.from({ length: hCount }).map((_, i) => (
          <Dot key={i} color={holeColor} size={holeSize} />
        ))}
      </View>
      <View style={[styles.col, { left: -half }]}>
        {Array.from({ length: vCount }).map((_, i) => (
          <Dot key={i} color={holeColor} size={holeSize} />
        ))}
      </View>
      <View style={[styles.col, { right: -half }]}>
        {Array.from({ length: vCount }).map((_, i) => (
          <Dot key={i} color={holeColor} size={holeSize} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  col: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
});
