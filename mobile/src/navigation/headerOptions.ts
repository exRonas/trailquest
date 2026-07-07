import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors, fontFamilyMedium, useThemeColors } from '../theme';

/** Shared native-stack header styling so all stacks look consistent, tinted
 *  with the current user's brand accent. */
export function useDefaultStackOptions(): NativeStackNavigationOptions {
  const theme = useThemeColors();
  return {
    headerStyle: { backgroundColor: colors.surface },
    headerTitleStyle: {
      color: colors.text,
      fontFamily: fontFamilyMedium,
      fontSize: 17,
    },
    headerTintColor: theme.primary,
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: colors.background },
  };
}
