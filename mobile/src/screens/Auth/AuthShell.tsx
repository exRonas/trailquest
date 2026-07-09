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
import { CloudDrift, MountainScene, Sway, TopoPattern } from '../../components/decor';
import { colors, radius, spacing, useDesignVersion, useThemeColors } from '../../theme';

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
  const design = useDesignVersion();

  if (design === 'v3') {
    // Atlas: full-bleed expedition poster — topo contours across the whole
    // page, the brand block sitting on a mountain-ridge hero card.
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <TopoPattern color={theme.primary} opacity={0.1} />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.atlasHero,
                { backgroundColor: theme.primaryTint, borderColor: theme.border },
              ]}
            >
              <TopoPattern color={theme.primary} opacity={0.2} />
              <CloudDrift color={theme.surface} top={18} size={58} crossSeconds={56} phase={0.3} opacity={0.8} />
              <CloudDrift color={theme.surface} top={54} size={38} crossSeconds={80} phase={0.7} opacity={0.55} />
              <View style={styles.atlasHeroBody}>
                <View style={[styles.logo, { backgroundColor: theme.primary }]}>
                  <Sway deg={9} duration={3400}>
                    <Icon name="compass-rose" size={38} color={theme.textInverse} />
                  </Sway>
                </View>
                <AppText variant="overline" color={theme.accent} style={styles.brand}>
                  TrailQuest
                </AppText>
                <AppText variant="title" style={styles.title}>
                  {title}
                </AppText>
                <AppText
                  variant="callout"
                  color={theme.textSecondary}
                  style={styles.subtitle}
                >
                  {subtitle}
                </AppText>
              </View>
              <MountainScene
                far={theme.primary}
                mid={theme.primary}
                near={theme.primaryDark}
                sun={theme.accent}
                height={64}
              />
            </View>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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

  // Atlas (v3)
  atlasHero: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  atlasHeroBody: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
});
