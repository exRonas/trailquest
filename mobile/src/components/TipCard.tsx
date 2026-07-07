import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './ui';
import { colors, radius, spacing } from '../theme';
import { tipIcon } from '../theme/icons';
import { labelForTipType } from '../utils/format';
import { usePickLocalized } from '../i18n';
import { RouteTip } from '../types/api';

/**
 * Visually distinguishes WARNING (red, alert) from ADVICE (teal, lightbulb)
 * with a coloured left rail, icon and tint.
 */
export function TipCard({ tip }: { tip: RouteTip }): React.ReactElement {
  const pickLocalized = usePickLocalized();
  const c = colors.tip[tip.type];
  return (
    <View style={[styles.card, { backgroundColor: c.soft }]}>
      <View style={[styles.rail, { backgroundColor: c.main }]} />
      <Icon name={tipIcon[tip.type]} size={20} color={c.main} style={styles.icon} />
      <View style={styles.body}>
        <AppText variant="overline" color={c.main}>
          {labelForTipType(tip.type)}
        </AppText>
        <AppText variant="callout" color={colors.text} style={styles.text}>
          {pickLocalized(tip.text)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  icon: { marginRight: spacing.md, marginTop: 2 },
  body: { flex: 1 },
  text: { marginTop: 2 },
});
