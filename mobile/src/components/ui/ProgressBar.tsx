import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { radius, useThemeColors } from '../../theme';

interface ProgressBarProps {
  /** 0..1 */
  value: number;
  height?: number;
  color?: string;
  trackColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  value,
  height = 8,
  color,
  trackColor,
  style,
}: ProgressBarProps): React.ReactElement {
  const theme = useThemeColors();
  const resolvedColor = color ?? theme.primary;
  const resolvedTrack = trackColor ?? theme.surfaceAlt;
  const clamped = Math.max(0, Math.min(1, value));
  const anim = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [clamped, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: resolvedTrack },
        style,
      ]}
    >
      <Animated.View
        style={[styles.fill, { width, backgroundColor: resolvedColor, borderRadius: height / 2 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden', borderRadius: radius.pill },
  fill: { height: '100%' },
});
