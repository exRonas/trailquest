import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './AppText';
import { radius, spacing, useDesignVersion, useThemeColors } from '../../theme';

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
  const design = useDesignVersion();
  // Terra: selected chips invert to ink-on-surface (Airbnb's filter chips go
  // near-black when active; in dark mode that flips to near-white) and the
  // outline thins to a hairline.
  const selectedBg = design === 'v2' ? theme.text : theme.primary;
  const selectedFg = design === 'v2' ? theme.surface : theme.textInverse;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        design === 'v2' ? styles.thinBorder : null,
        selected
          ? { backgroundColor: selectedBg, borderColor: selectedBg }
          : { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {icon ? (
        <Icon
          name={icon}
          size={14}
          color={selected ? selectedFg : theme.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <AppText
        variant="label"
        color={selected ? selectedFg : theme.textSecondary}
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
  thinBorder: { borderWidth: 1 },
  icon: { marginRight: 4 },
});
