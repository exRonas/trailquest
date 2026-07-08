import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { fontFamilyMedium, useThemeColors } from '../theme';

/** Shared native-stack header styling so all stacks look consistent, tinted
 *  with the current user's brand accent. */
export function useDefaultStackOptions(): NativeStackNavigationOptions {
  const theme = useThemeColors();
  return {
    headerStyle: { backgroundColor: theme.surface },
    headerTitleStyle: {
      color: theme.text,
      fontFamily: fontFamilyMedium,
      fontSize: 17,
    },
    headerTintColor: theme.primary,
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: theme.background },
  };
}
