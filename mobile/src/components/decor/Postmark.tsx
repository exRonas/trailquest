import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from '../ui/AppText';

interface PostmarkProps {
  /** Cancellation-ink color (usually the rust accent). */
  color: string;
  /** Text stamped across the middle, e.g. "TRAILQUEST". */
  label?: string;
  size?: number;
  opacity?: number;
}

/**
 * Faded postal cancellation mark (Atlas design): two concentric circles with
 * wavy killer bars trailing off to the right, slightly rotated — the stamp
 * has "been through the mail". Position it over a corner of the stamp photo.
 */
export function Postmark({
  color,
  label = 'TRAILQUEST',
  size = 92,
  opacity = 0.65,
}: PostmarkProps): React.ReactElement {
  return (
    <View pointerEvents="none" style={[styles.wrap, { width: size * 1.6, height: size, opacity }]}>
      <Svg width="100%" height="100%" viewBox="0 0 160 100">
        <Circle cx={50} cy={50} r={46} stroke={color} strokeWidth={2.4} fill="none" />
        <Circle cx={50} cy={50} r={36} stroke={color} strokeWidth={1.4} fill="none" />
        {/* Killer bars — wavy cancellation lines running off the circle */}
        <Path d="M92 34 C 112 28, 132 40, 156 34" stroke={color} strokeWidth={2.2} fill="none" />
        <Path d="M94 50 C 114 44, 134 56, 158 50" stroke={color} strokeWidth={2.2} fill="none" />
        <Path d="M92 66 C 112 60, 132 72, 156 66" stroke={color} strokeWidth={2.2} fill="none" />
      </Svg>
      <View style={[styles.labelWrap, { width: size }]}>
        <AppText
          variant="overline"
          center
          color={color}
          numberOfLines={1}
          style={styles.label}
        >
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { transform: [{ rotate: '-12deg' }] },
  labelWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 9, letterSpacing: 1.2 },
});
