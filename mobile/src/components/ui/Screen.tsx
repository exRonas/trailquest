import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  RefreshControl,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { spacing, useThemeColors } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: Edge[];
  backgroundColor?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/** Safe-area-aware screen container with optional scrolling + pull-to-refresh. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  contentStyle,
  edges = ['top'],
  backgroundColor,
  refreshing,
  onRefresh,
}: ScreenProps): React.ReactElement {
  const theme = useThemeColors();
  const bg = backgroundColor ?? theme.background;
  const inner: ViewStyle = {
    ...(padded ? { padding: spacing.xl } : null),
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }, style]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[inner, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, inner, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
});
