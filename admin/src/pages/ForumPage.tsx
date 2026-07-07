import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteComment, deletePost, fetchAllPosts, fetchComments } from '../api/forum';
import { apiErrorMessage } from '../api/client';
import { pickLocalizedText } from '../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function ForumPage() {
  const qc = useQueryClient();
  const [openPostId, setOpenPostId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: fetchAllPosts,
  });

  const delPost = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['admin-posts'] });
      if (openPostId === id) setOpenPostId(null);
    },
  });

  const onDeletePost = (id: string, title: string) => {
    if (window.confirm(`Delete post "${title}"? All its comments are deleted too. This cannot be undone.`)) {
      delPost.mutate(id);
    }
  };

  return (
    <div className="container">
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Forum moderation</h2>
      </div>

      {isLoading ? <div className="spinner">Loading posts…</div> : null}
      {isError ? <div className="error">{apiErrorMessage(error)}</div> : null}
      {delPost.isError ? <div className="error">{apiErrorMessage(delPost.error)}</div> : null}

      {(data ?? []).map((post) => (
        <div key={post.id} className="route-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{post.title}</div>
              <div className="muted">
                {pickLocalizedText({ ru: post.route.titleRu, en: post.route.titleEn, kk: post.route.titleKk })}
                {' · '}
                {post.user.name} · {formatDate(post.createdAt)} ·{' '}
                {post._count.comments} comment{post._count.comments === 1 ? '' : 's'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="secondary"
                onClick={() => setOpenPostId(openPostId === post.id ? null : post.id)}
              >
                {openPostId === post.id ? 'Hide comments' : 'View comments'}
              </button>
              <button
                className="danger"
                onClick={() => onDeletePost(post.id, post.title)}
                disabled={delPost.isPending}
              >
                Delete post
              </button>
            </div>
          </div>
          {openPostId === post.id ? <CommentList postId={post.id} /> : null}
        </div>
      ))}

      {data && data.length === 0 ? <div className="muted">No posts yet.</div> : null}
    </div>
  );
}

function CommentList({ postId }: { postId: string }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-comments', postId],
    queryFn: () => fetchComments(postId),
  });

  const delComment = useMutation({
    mutationFn: (commentId: string) => deleteComment(postId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-comments', postId] });
      qc.invalidateQueries({ queryKey: ['admin-posts'] });
    },
  });

  const onDelete = (commentId: string, body: string) => {
    const preview = body.length > 60 ? `${body.slice(0, 60)}…` : body;
    if (window.confirm(`Delete comment "${preview}"? This cannot be undone.`)) {
      delComment.mutate(commentId);
    }
  };

  return (
    <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid #eee' }}>
      {isLoading ? <div className="spinner">Loading comments…</div> : null}
      {isError ? <div className="error">{apiErrorMessage(error)}</div> : null}
      {delComment.isError ? <div className="error">{apiErrorMessage(delComment.error)}</div> : null}
      {(data ?? []).map((c) => (
        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
          <div>
            <span style={{ fontWeight: 600 }}>{c.user.name}</span>{' '}
            <span className="muted">{formatDate(c.createdAt)}</span>
            <div>{c.body}</div>
          </div>
          <button
            className="danger"
            onClick={() => onDelete(c.id, c.body)}
            disabled={delComment.isPending}
          >
            Delete
          </button>
        </div>
      ))}
      {data && data.length === 0 ? <div className="muted">No comments.</div> : null}
    </div>
  );
}
