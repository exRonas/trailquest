import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from './ui';
import { colors, radius, shadow, spacing, useThemeColors } from '../theme';
import { useT } from '../i18n';
import {
  getLocationAuthStatus,
  requestLocationPermission,
} from '../services/geolocation';

interface LocationPermissionBannerProps {
  /** Called once permission becomes granted (initial check or after tapping enable). */
  onGranted: () => void;
}

/**
 * Slides down from the top when location permission is missing, with a button
 * that requests it inline; slides back up the moment it's granted (including
 * when the user grants it from OS Settings and returns to the app).
 */
export function LocationPermissionBanner({
  onGranted,
}: LocationPermissionBannerProps): React.ReactElement | null {
  const t = useT();
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const [denied, setDenied] = useState(false);
  const translateY = useRef(new Animated.Value(-200)).current;

  const slideTo = useCallback(
    (visible: boolean) => {
      Animated.timing(translateY, {
        toValue: visible ? 0 : -200,
        duration: 280,
        useNativeDriver: true,
      }).start();
    },
    [translateY],
  );

  const check = useCallback(async () => {
    const auth = await getLocationAuthStatus();
    if (auth === 'denied') {
      setDenied(true);
      slideTo(true);
    } else {
      setDenied(false);
      slideTo(false);
      onGranted();
    }
  }, [onGranted, slideTo]);

  useEffect(() => {
    void check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => sub.remove();
  }, [check]);

  const onEnable = useCallback(async () => {
    const auth = await requestLocationPermission();
    if (auth !== 'denied') {
      setDenied(false);
      slideTo(false);
      onGranted();
    }
  }, [onGranted, slideTo]);

  if (!denied) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { top: insets.top + spacing.sm, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Icon name="crosshairs-gps" size={22} color={theme.primary} />
        <AppText variant="callout" style={styles.text}>
          {t('explore.locationPromptMessage')}
        </AppText>
        <Pressable onPress={onEnable} hitSlop={8}>
          <AppText variant="bodyStrong" color={theme.primary}>
            {t('explore.locationPromptAction')}
          </AppText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 50,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadow.md,
  },
  text: { flex: 1, marginHorizontal: spacing.sm },
});
