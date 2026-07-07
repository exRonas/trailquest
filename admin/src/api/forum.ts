import { api, unwrap } from './client';
import { AdminForumPost, ForumComment } from '../types';

export async function fetchAllPosts(): Promise<AdminForumPost[]> {
  const res = await api.get<{ data: AdminForumPost[] }>('/posts');
  return unwrap(res.data);
}

export async function fetchComments(postId: string): Promise<ForumComment[]> {
  const res = await api.get<{ data: ForumComment[] }>(`/posts/${postId}/comments`);
  return unwrap(res.data);
}

export async function deletePost(postId: string): Promise<void> {
  await api.delete(`/posts/${postId}`);
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await api.delete(`/posts/${postId}/comments/${commentId}`);
}
