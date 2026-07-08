import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types/navigation';
import { useDefaultStackOptions } from './headerOptions';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { ActivityDetailScreen } from '../screens/Profile/ActivityDetailScreen';
import { AllActivitiesScreen } from '../screens/Profile/AllActivitiesScreen';
import { LeaderboardScreen } from '../screens/Profile/LeaderboardScreen';
import { AchievementsScreen } from '../screens/Profile/AchievementsScreen';
import { SettingsScreen } from '../screens/Profile/SettingsScreen';
import { FriendsScreen } from '../screens/Profile/FriendsScreen';
import { translate, useLocaleStore } from '../i18n';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack(): React.ReactElement {
  const language = useLocaleStore((s) => s.language);
  const stackOptions = useDefaultStackOptions();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: translate(language, 'tab.profile') }}
      />
      <Stack.Screen
        name="ActivityDetail"
        component={ActivityDetailScreen}
        options={{ title: translate(language, 'activity.title') }}
      />
      <Stack.Screen
        name="AllActivities"
        component={AllActivitiesScreen}
        options={{ title: translate(language, 'profile.yourRoutes') }}
      />
      <Stack.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: translate(language, 'leaderboard.title') }}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: translate(language, 'achievements.title') }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: translate(language, 'settings.title') }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: translate(language, 'friends.title') }}
      />
    </Stack.Navigator>
  );
}
