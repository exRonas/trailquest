import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MainTabParamList } from '../types/navigation';
import { ExploreStack } from './ExploreStack';
import { ForumStack } from './ForumStack';
import { ProfileStack } from './ProfileStack';
import { fontFamilyMedium, useThemeColors } from '../theme';
import { useT } from '../i18n';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  ExploreTab: 'compass-outline',
  ForumTab: 'forum-outline',
  ProfileTab: 'account-circle-outline',
};

export function MainTabs(): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 86 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: { fontFamily: fontFamilyMedium, fontSize: 11 },
        tabBarIcon: ({ color, size }) => (
          <Icon name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="ExploreTab"
        component={ExploreStack}
        options={{ title: t('tab.explore') }}
      />
      <Tab.Screen
        name="ForumTab"
        component={ForumStack}
        options={{ title: t('tab.forum') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{ title: t('tab.profile') }}
      />
    </Tab.Navigator>
  );
}
