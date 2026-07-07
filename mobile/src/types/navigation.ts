import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type ExploreStackParamList = {
  Explore: undefined;
  Countries: undefined;
  CountryRoutes: { country: string };
  RouteDetail: { routeId: string };
  ActiveNavigation: { routeId: string; progressId: string };
};

export type ForumStackParamList = {
  ForumRoutes: undefined;
  RoutePosts: { routeId: string; routeTitle: string };
  PostDetail: { postId: string; postTitle: string };
  CreatePost: { routeId: string };
  UserProfile: { userId: string; userName: string };
  PublicActivityDetail: { userId: string; progressId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  ActivityDetail: { progressId: string };
};

export type MainTabParamList = {
  ExploreTab: NavigatorScreenParams<ExploreStackParamList>;
  ForumTab: NavigatorScreenParams<ForumStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Per-screen prop helpers
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type ExploreScreenProps<T extends keyof ExploreStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ExploreStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type ForumScreenProps<T extends keyof ForumStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ForumStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type ProfileScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;
