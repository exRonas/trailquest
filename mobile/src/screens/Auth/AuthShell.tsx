import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText } from '../../components/ui';
import { colors, radius, spacing, useThemeColors } from '../../theme';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/** Shared branded shell for the Login / Register screens. */
export function AuthShell({
  title,
  subtitle,
  children,
}: AuthShellProps): React.ReactElement {
  const theme = useThemeColors();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.logo, { backgroundColor: theme.primary }]}>
              <Icon name="compass-rose" size={38} color={colors.textInverse} />
            </View>
            <AppText variant="overline" color={colors.accent} style={styles.brand}>
              TrailQuest
            </AppText>
            <AppText variant="title" style={styles.title}>
              {title}
            </AppText>
            <AppText
              variant="callout"
              color={colors.textSecondary}
              style={styles.subtitle}
            >
              {subtitle}
            </AppText>
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  brand: { letterSpacing: 2 },
  title: { marginTop: spacing.xs },
  subtitle: { marginTop: spacing.xs, textAlign: 'center' },
});
