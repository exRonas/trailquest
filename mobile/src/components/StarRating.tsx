import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme';

interface StarRatingProps {
  /** Current value, 0..5 (fractional allowed for display). */
  value: number;
  size?: number;
  /** When set, stars become tappable and call back with 1..5. */
  onChange?: (rating: number) => void;
  color?: string;
}

/**
 * Five stars. Read-only when `onChange` is omitted (shows half-stars for
 * fractional averages); tappable 1..5 selector when it's provided.
 */
export function StarRating({
  value,
  size = 18,
  onChange,
  color = colors.warning,
}: StarRatingProps): React.ReactElement {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.row}>
      {stars.map((n) => {
        const name =
          value >= n
            ? 'star'
            : value >= n - 0.5 && !onChange
              ? 'star-half-full'
              : 'star-outline';
        const icon = (
          <Icon
            name={name}
            size={size}
            color={value >= n - 0.5 ? color : colors.textMuted}
          />
        );
        if (!onChange) {
          return (
            <View key={n} style={styles.star}>
              {icon}
            </View>
          );
        }
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            hitSlop={6}
            style={styles.star}
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { marginRight: 2 },
});
