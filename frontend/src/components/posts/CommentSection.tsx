import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '../../types';
import { useAuthStore } from '../../store/authStore';
import {
  useComments,
  useAddComment,
  useDeleteComment,
  useReplyToComment,
  useCommentReplies,
} from '../../hooks/usePosts';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  isLoading: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

const CommentForm = ({ onSubmit, isLoading, placeholder = 'Write a comment...', autoFocus = false }: CommentFormProps) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={!content.trim() || isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
      >
        {isLoading ? 'Posting...' : 'Post'}
      </button>
    </form>
  );
};

interface CommentCardProps {
  comment: Comment;
  postId: string;
  isReply?: boolean;
}

const CommentCard = ({ comment, postId, isReply = false }: CommentCardProps) => {
  const { user } = useAuthStore();
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const deleteComment = useDeleteComment();
  const replyToComment = useReplyToComment();
  const { data: repliesData, isLoading: repliesLoading } = useCommentReplies(comment.id, showReplies);

  const isAuthor = user?.id === comment.authorId;
  const hasReplies = comment._count?.replies > 0;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment.mutateAsync(comment.id);
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  const handleReply = async (content: string) => {
    try {
      await replyToComment.mutateAsync({ commentId: comment.id, content });
      setShowReplyForm(false);
      setShowReplies(true);
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };

  return (
    <div className={`${isReply ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="flex gap-3">
        <Link to={`/profile/${comment.author.username}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {comment.author.avatar ? (
              <img src={comment.author.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              comment.author.displayName.charAt(0).toUpperCase()
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Link
                to={`/profile/${comment.author.username}`}
                className="font-medium text-gray-900 hover:text-blue-600 text-sm"
              >
                {comment.author.displayName}
              </Link>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-1 ml-2">
            <button
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              Reply
            </button>
            {hasReplies && !isReply && (
              <button
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? 'Hide replies' : `View ${comment._count.replies} ${comment._count.replies === 1 ? 'reply' : 'replies'}`}
              </button>
            )}
            {isAuthor && (
              <button
                onClick={handleDelete}
                className="text-xs text-gray-400 hover:text-red-600 font-medium"
                disabled={deleteComment.isPending}
              >
                Delete
              </button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-2 ml-2">
              <CommentForm
                onSubmit={handleReply}
                isLoading={replyToComment.isPending}
                placeholder={`Reply to ${comment.author.displayName}...`}
                autoFocus
              />
            </div>
          )}

          {showReplies && (
            <div className="mt-3 space-y-3">
              {repliesLoading ? (
                <p className="text-sm text-gray-500 ml-2">Loading replies...</p>
              ) : (
                repliesData?.replies?.map((reply) => (
                  <CommentCard key={reply.id} comment={reply} postId={postId} isReply />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface CommentSectionProps {
  postId: string;
}

export const CommentSection = ({ postId }: CommentSectionProps) => {
  const { data, isLoading, isError } = useComments(postId);
  const addComment = useAddComment();

  const handleAddComment = async (content: string) => {
    try {
      await addComment.mutateAsync({ postId, content });
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <CommentForm onSubmit={handleAddComment} isLoading={addComment.isPending} />

      <div className="mt-4 space-y-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading comments...</p>
        ) : isError ? (
          <p className="text-sm text-red-500">Failed to load comments</p>
        ) : data?.comments?.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          data?.comments?.map((comment) => (
            <CommentCard key={comment.id} comment={comment} postId={postId} />
          ))
        )}
      </div>
    </div>
  );
};
