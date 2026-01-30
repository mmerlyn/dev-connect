import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePost, useDeletePost, useLikePost, useUnlikePost } from '../hooks/usePosts';
import { useAuthStore } from '../store/authStore';
import { CommentSection } from '../components/posts/CommentSection';
import { formatDistanceToNow } from 'date-fns';

export const Post = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: post, isLoading, error } = usePost(postId || '');
  const deletePost = useDeletePost();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();

  const handleDelete = async () => {
    if (!postId || !window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost.mutateAsync(postId);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleLike = async () => {
    if (!postId) return;
    try {
      if (post?.isLiked) {
        await unlikePost.mutateAsync(postId);
      } else {
        await likePost.mutateAsync(postId);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Post not found</h2>
          <p className="text-gray-500 mb-4">This post may have been deleted or doesn't exist.</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Go back to feed
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === post.author.id;

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      {/* Post content */}
      <div className="bg-white rounded-lg shadow">
        {/* Author header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <Link to={`/profile/${post.author.username}`} className="flex items-center gap-3">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  {post.author.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 hover:text-blue-600">{post.author.displayName}</p>
                <p className="text-sm text-gray-500">@{post.author.username}</p>
              </div>
            </Link>

            {isAuthor && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deletePost.isPending}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete post"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Post body */}
        <div className="p-4">
          <p className="text-gray-900 text-lg whitespace-pre-wrap mb-4">{post.content}</p>

          {/* Code snippet */}
          {post.codeSnippet && (
            <div className="mb-4">
              <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 rounded-t-lg text-sm">
                <span>{post.language || 'Code'}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(post.codeSnippet!)}
                  className="hover:text-white transition-colors"
                  title="Copy code"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
                <code className="text-sm font-mono">{post.codeSnippet}</code>
              </pre>
            </div>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.hashtags.map((tag) => (
                <Link
                  key={tag}
                  to={`/hashtag/${tag.replace('#', '')}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <p className="text-sm text-gray-500 mb-4">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            {post.views !== undefined && ` · ${post.views.toLocaleString()} views`}
          </p>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-6">
          <button
            onClick={handleLike}
            disabled={likePost.isPending || unlikePost.isPending}
            className={`flex items-center gap-2 ${
              post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            } transition-colors`}
          >
            <svg
              className="w-6 h-6"
              fill={post.isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="font-medium">{post._count?.likes || 0} likes</span>
          </button>

          <div className="flex items-center gap-2 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="font-medium">{post._count?.comments || 0} comments</span>
          </div>
        </div>

        {/* Comments section */}
        <div className="border-t border-gray-100">
          <CommentSection postId={post.id} />
        </div>
      </div>
    </div>
  );
};
