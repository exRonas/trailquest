import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './AppText';
import { colors, radius, spacing, useThemeColors } from '../../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
}

/** Selectable filter chip used in the Explore filter bar. */
export function Chip({
  label,
  selected = false,
  onPress,
  icon,
}: ChipProps): React.ReactElement {
  const theme = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: theme.primary, borderColor: theme.primary }
          : styles.unselected,
      ]}
    >
      {icon ? (
        <Icon
          name={icon}
          size={14}
          color={selected ? colors.textInverse : colors.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <AppText
        variant="label"
        color={selected ? colors.textInverse : colors.textSecondary}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  icon: { marginRight: 4 },
});
