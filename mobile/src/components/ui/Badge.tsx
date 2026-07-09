import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './AppText';
import { radius, spacing } from '../../theme';

interface BadgeProps {
  label: string;
  /** Foreground (text/icon) colour. */
  color: string;
  /** Background colour (usually a soft tint of `color`). */
  background: string;
  icon?: string;
  style?: ViewStyle;
}

/** Small rounded pill used for category / difficulty / type tags. */
export function Badge({
  label,
  color,
  background,
  icon,
  style,
}: BadgeProps): React.ReactElement {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: background },
        style,
      ]}
    >
      {icon ? (
        <Icon name={icon} size={13} color={color} style={styles.icon} />
      ) : null}
      <AppText variant="overline" color={color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  icon: { marginRight: 4 },
});
