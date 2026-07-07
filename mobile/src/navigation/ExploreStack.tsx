import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../types/navigation';
import { useDefaultStackOptions } from './headerOptions';
import { ExploreScreen } from '../screens/Explore/ExploreScreen';
import { CountriesScreen } from '../screens/Countries/CountriesScreen';
import { CountryRoutesScreen } from '../screens/Countries/CountryRoutesScreen';
import { RouteDetailScreen } from '../screens/RouteDetail/RouteDetailScreen';
import { ActiveNavigationScreen } from '../screens/ActiveNavigation/ActiveNavigationScreen';
import { translate, useLocaleStore } from '../i18n';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export function ExploreStack(): React.ReactElement {
  const language = useLocaleStore((s) => s.language);
  const stackOptions = useDefaultStackOptions();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Countries"
        component={CountriesScreen}
        options={{ title: translate(language, 'countries.title') }}
      />
      <Stack.Screen
        name="CountryRoutes"
        component={CountryRoutesScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="RouteDetail"
        component={RouteDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActiveNavigation"
        component={ActiveNavigationScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
