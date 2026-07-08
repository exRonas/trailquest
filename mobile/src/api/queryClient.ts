import { QueryClient, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// Without this, React Query has no idea the device is offline — it just
// retries each failed fetch (with backoff, on top of axios's own 15s
// timeout per attempt), so a query with no cached data sits in `isLoading`
// through several slow, doomed attempts before finally erroring. Wiring
// NetInfo in makes it mark queries "paused" the instant connectivity drops:
// no more attempts, no more waiting, and it resumes automatically the
// moment `isConnected` flips back — this is the fix for "app hangs / waits
// for internet" reported after finishing a route with no signal.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  routes: (filters?: unknown) => ['routes', filters ?? {}] as const,
  route: (id: string) => ['route', id] as const,
  countries: (lang: string) => ['routes', 'countries', lang] as const,
  myProgress: () => ['progress', 'mine'] as const,
  myLevels: () => ['progress', 'levels'] as const,
  myLevel: () => ['progress', 'level'] as const,
  posts: (routeId: string) => ['posts', routeId] as const,
  post: (postId: string) => ['post', postId] as const,
  comments: (postId: string) => ['comments', postId] as const,
  publicProfile: (userId: string) => ['users', 'profile', userId] as const,
  reviews: (routeId: string) => ['reviews', routeId] as const,
  leaderboard: () => ['leaderboard'] as const,
  myAchievements: () => ['achievements', 'mine'] as const,
};
