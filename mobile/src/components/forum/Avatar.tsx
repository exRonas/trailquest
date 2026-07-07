import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../ui';
import { colors, palette } from '../../theme';

const AVATAR_COLORS = [
  palette.pine500,
  palette.clay500,
  palette.blue500,
  palette.purple600,
  palette.teal600,
  palette.amber500,
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: number;
}

/** Deterministic colour + initials avatar (no image upload in v1). */
export function Avatar({ name, size = 40 }: AvatarProps): React.ReactElement {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colorFor(name) },
      ]}
    >
      <AppText variant={size < 36 ? 'label' : 'bodyStrong'} color={colors.textInverse}>
        {initials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
});
