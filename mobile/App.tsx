/**
 * TrailQuest — app root.
 * Providers (gesture handler, safe area, react-query) wrap the root navigator,
 * which decides between the auth flow and the main tabs based on session state.
 *
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/api/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
