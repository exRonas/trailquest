import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors, fontFamilyMedium } from '../theme';

/** Shared native-stack header styling so all stacks look consistent. */
export const defaultStackOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: {
    color: colors.text,
    fontFamily: fontFamilyMedium,
    fontSize: 17,
  },
  headerTintColor: colors.primary,
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: colors.background },
};
