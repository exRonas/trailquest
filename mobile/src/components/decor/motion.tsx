import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

/**
 * Idle-motion primitives for the Atlas design: slow, small, native-driver
 * loops that make decor feel alive without demanding attention. All of them
 * are pure transforms (translate/rotate/scale) so they run on the UI thread.
 */

function useLoop(duration: number, delay = 0): Animated.Value {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [v, duration, delay]);
  return v;
}

interface MotionProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Full cycle = 2 × duration (there and back). */
  duration?: number;
  /** Stagger start so several instances don't move in sync. */
  delay?: number;
}

/** Gentle vertical float (±range px). */
export function Drift({
  children,
  style,
  duration = 2600,
  delay = 0,
  range = 5,
}: MotionProps & { range?: number }): React.ReactElement {
  const v = useLoop(duration, delay);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [range, -range] });
  return <Animated.View style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
}

/** Slow compass-needle wobble (±deg). */
export function Sway({
  children,
  style,
  duration = 3200,
  delay = 0,
  deg = 7,
}: MotionProps & { deg?: number }): React.ReactElement {
  const v = useLoop(duration, delay);
  const rotate = v.interpolate({
    inputRange: [0, 1],
    outputRange: [`-${deg}deg`, `${deg}deg`],
  });
  return <Animated.View style={[style, { transform: [{ rotate }] }]}>{children}</Animated.View>;
}

/** Soft breathing scale. */
export function Pulse({
  children,
  style,
  duration = 2200,
  delay = 0,
  to = 1.05,
}: MotionProps & { to?: number }): React.ReactElement {
  const v = useLoop(duration, delay);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, to] });
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}
