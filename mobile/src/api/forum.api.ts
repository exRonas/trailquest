import { api, unwrap } from './client';
import { ForumComment, ForumPost } from '../types/api';

export async function fetchPosts(routeId: string): Promise<ForumPost[]> {
  const res = await api.get<{ data: ForumPost[] }>(`/routes/${routeId}/posts`);
  return unwrap(res.data);
}

export async function createPost(
  routeId: string,
  input: { title: string; body: string },
): Promise<ForumPost> {
  const res = await api.post<{ data: ForumPost }>(
    `/routes/${routeId}/posts`,
    input,
  );
  return unwrap(res.data);
}

export async function fetchPost(postId: string): Promise<ForumPost> {
  const res = await api.get<{ data: ForumPost }>(`/posts/${postId}`);
  return unwrap(res.data);
}

export async function fetchComments(postId: string): Promise<ForumComment[]> {
  const res = await api.get<{ data: ForumComment[] }>(
    `/posts/${postId}/comments`,
  );
  return unwrap(res.data);
}

export async function createComment(
  postId: string,
  body: string,
): Promise<ForumComment> {
  const res = await api.post<{ data: ForumComment }>(
    `/posts/${postId}/comments`,
    { body },
  );
  return unwrap(res.data);
}
