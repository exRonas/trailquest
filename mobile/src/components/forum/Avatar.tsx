import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '../ui';
import { colors, palette } from '../../theme';
import { parseAvatarId } from '../avatars';

const FALLBACK_COLORS = [
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
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  /** Preset avatar id ("panda-2"); falls back to initials when absent. */
  avatar?: string | null;
  size?: number;
}

/** Cartoon-icon avatar when the user picked one, initials otherwise. */
export function Avatar({ name, avatar, size = 40 }: AvatarProps): React.ReactElement {
  const spec = parseAvatarId(avatar);
  if (spec) {
    return (
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: spec.bg },
        ]}
      >
        <Icon name={spec.icon} size={Math.round(size * 0.62)} color={spec.fg} />
      </View>
    );
  }
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
