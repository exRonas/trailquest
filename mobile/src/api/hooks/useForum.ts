import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createComment,
  createPost,
  fetchComments,
  fetchPost,
  fetchPosts,
} from '../forum.api';
import { queryKeys } from '../queryClient';
import { ForumComment, ForumPost } from '../../types/api';
import { useAuthStore } from '../../store/authStore';

export function usePosts(routeId: string) {
  return useQuery({
    queryKey: queryKeys.posts(routeId),
    queryFn: () => fetchPosts(routeId),
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: queryKeys.post(postId),
    queryFn: () => fetchPost(postId),
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: queryKeys.comments(postId),
    queryFn: () => fetchComments(postId),
  });
}

const tempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useCreatePost(routeId: string) {
  const qc = useQueryClient();
  const key = queryKeys.posts(routeId);

  return useMutation({
    mutationFn: (input: { title: string; body: string }) =>
      createPost(routeId, input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ForumPost[]>(key);
      const user = useAuthStore.getState().user;
      const optimistic: ForumPost = {
        id: tempId(),
        routeId,
        userId: user?.id ?? 'me',
        title: input.title,
        body: input.body,
        createdAt: new Date().toISOString(),
        user: { id: user?.id ?? 'me', name: user?.name ?? 'You', avatar: user?.avatar ?? null },
        _count: { comments: 0 },
      };
      qc.setQueryData<ForumPost[]>(key, (old) => [optimistic, ...(old ?? [])]);
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  const key = queryKeys.comments(postId);

  return useMutation({
    mutationFn: (body: string) => createComment(postId, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ForumComment[]>(key);
      const user = useAuthStore.getState().user;
      const optimistic: ForumComment = {
        id: tempId(),
        postId,
        userId: user?.id ?? 'me',
        body,
        createdAt: new Date().toISOString(),
        user: { id: user?.id ?? 'me', name: user?.name ?? 'You', avatar: user?.avatar ?? null },
      };
      qc.setQueryData<ForumComment[]>(key, (old) => [...(old ?? []), optimistic]);
      return { previous };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
    },
  });
}
