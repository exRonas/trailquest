import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ForumStackParamList } from '../types/navigation';
import { useDefaultStackOptions } from './headerOptions';
import { ForumRoutesScreen } from '../screens/Forum/ForumRoutesScreen';
import { RoutePostsScreen } from '../screens/Forum/RoutePostsScreen';
import { PostDetailScreen } from '../screens/Forum/PostDetailScreen';
import { CreatePostScreen } from '../screens/Forum/CreatePostScreen';
import { UserProfileScreen } from '../screens/Forum/UserProfileScreen';
import { PublicActivityDetailScreen } from '../screens/Forum/PublicActivityDetailScreen';
import { useT } from '../i18n';

const Stack = createNativeStackNavigator<ForumStackParamList>();

export function ForumStack(): React.ReactElement {
  const t = useT();
  const stackOptions = useDefaultStackOptions();
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen
        name="ForumRoutes"
        component={ForumRoutesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RoutePosts"
        component={RoutePostsScreen}
        options={{ title: t('route.discussion') }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: t('forum.postTitle') }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ title: t('forum.newPostTitle'), presentation: 'modal' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: t('userProfile.title') }}
      />
      <Stack.Screen
        name="PublicActivityDetail"
        component={PublicActivityDetailScreen}
        options={{ title: t('activity.title') }}
      />
    </Stack.Navigator>
  );
}
