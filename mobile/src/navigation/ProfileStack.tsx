import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types/navigation';
import { defaultStackOptions } from './headerOptions';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { ActivityDetailScreen } from '../screens/Profile/ActivityDetailScreen';
import { AllActivitiesScreen } from '../screens/Profile/AllActivitiesScreen';
import { translate, useLocaleStore } from '../i18n';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack(): React.ReactElement {
  const language = useLocaleStore((s) => s.language);
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
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
    </Stack.Navigator>
  );
}
