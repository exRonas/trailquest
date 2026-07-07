import { QueryClient } from '@tanstack/react-query';

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
  posts: (routeId: string) => ['posts', routeId] as const,
  post: (postId: string) => ['post', postId] as const,
  comments: (postId: string) => ['comments', postId] as const,
  publicProfile: (userId: string) => ['users', 'profile', userId] as const,
};
