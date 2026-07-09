import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface CloudProps {
  color: string;
  /** Cloud width in px; height scales with it. */
  size?: number;
  /** Vertical position (px from the top of the parent). */
  top: number;
  /** Seconds for one full crossing. */
  crossSeconds?: number;
  /** Start offset into the crossing (0..1) so clouds don't bunch up. */
  phase?: number;
  opacity?: number;
}

/**
 * A single flat-style cloud that drifts across its parent forever (Atlas
 * idle decor). Parent needs `overflow: 'hidden'` and a set width — the cloud
 * uses the window width as its travel distance, which is right for the
 * full-bleed hero cards it decorates.
 */
export function CloudDrift({
  color,
  size = 56,
  top,
  crossSeconds = 46,
  phase = 0,
  opacity = 0.5,
}: CloudProps): React.ReactElement {
  const { width } = useWindowDimensions();
  const v = useRef(new Animated.Value(phase)).current;

  useEffect(() => {
    // First leg finishes the remaining part of the crossing, then loop whole
    // crossings — keeps the phase offset without a visible jump.
    const rest = Animated.timing(v, {
      toValue: 1,
      duration: crossSeconds * 1000 * (1 - phase),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(v, {
          toValue: 1,
          duration: crossSeconds * 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    const seq = Animated.sequence([rest, loop]);
    seq.start();
    return () => seq.stop();
  }, [v, crossSeconds, phase]);

  const translateX = v.interpolate({
    inputRange: [0, 1],
    outputRange: [-size - 20, width + 20],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.cloud, { top, opacity, transform: [{ translateX }] }]}
    >
      <Svg width={size} height={size * 0.45} viewBox="0 0 100 45">
        <Path
          d="M12 38 C 2 38, 0 26, 9 22 C 8 12, 20 6, 28 12 C 33 2, 50 0, 56 10 C 66 4, 80 10, 79 20 C 90 20, 96 30, 89 38 Z"
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cloud: { position: 'absolute', left: 0 },
});
