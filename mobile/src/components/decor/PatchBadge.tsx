import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface PatchBadgeProps {
  /** Patch fabric color (fill). */
  fill: string;
  /** Stitch/border thread color. */
  stitch: string;
  size?: number;
  /** Icon (or any content) centered on the patch. */
  children?: React.ReactNode;
  /** Dim the whole patch for locked/unearned achievements. */
  muted?: boolean;
}

/**
 * Scout-style embroidered patch (Atlas design): a scalloped disc with a
 * dashed "stitch" ring, used as the achievement badge frame.
 */
export function PatchBadge({
  fill,
  stitch,
  size = 64,
  children,
  muted = false,
}: PatchBadgeProps): React.ReactElement {
  const r = 50;
  const cx = 60;
  const cy = 60;
  // Scallops: ring of small circles behind the main disc reads as a
  // pinked/zig-zag patch edge without needing a complex path.
  const scallops = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  return (
    <View style={[styles.wrap, { width: size, height: size }, muted ? styles.muted : null]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <G>
          {scallops.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={13} fill={fill} />
          ))}
          <Circle cx={cx} cy={cy} r={r + 4} fill={fill} />
          <Circle
            cx={cx}
            cy={cy}
            r={r - 5}
            fill="none"
            stroke={stitch}
            strokeWidth={2.5}
            strokeDasharray="7 5"
          />
        </G>
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: { opacity: 0.45 },
});
