import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCreatePost } from '../../hooks/usePosts';

export const PostForm = () => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const createPost = useCreatePost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createPost.mutateAsync({
        content: content.trim(),
        codeSnippet: codeSnippet.trim() || undefined,
        language: codeSnippet.trim() ? language : undefined,
      });
      setContent('');
      setCodeSnippet('');
      setShowCodeEditor(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <textarea
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {showCodeEditor && (
              <div className="mt-3">
                <div className="flex items-center space-x-2 mb-2">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="sql">SQL</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCodeEditor(false);
                      setCodeSnippet('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Remove code
                  </button>
                </div>
                <textarea
                  placeholder="Paste your code here..."
                  className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50"
                  rows={8}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {!showCodeEditor && (
                  <button
                    type="button"
                    onClick={() => setShowCodeEditor(true)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Add code snippet"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!content.trim() || createPost.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPost.isPending ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
