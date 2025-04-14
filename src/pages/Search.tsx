import React from "react";
import Layout from "../components/Layout";
import usePostStore from "../store/postStore";
import useSearchStore from "../store/searchStore"; // ✅ Get search query from Zustand

const Search = () => {
  const { posts } = usePostStore(); // ✅ Fetch posts
  const { query } = useSearchStore(); // ✅ Get global search query

  // Filter posts based on search query
  const filteredResults = posts.filter(
    (post) =>
      post.user.toLowerCase().includes(query) ||
      post.profession.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query)
  );

  return (
    <Layout>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Search Results</h2>

        {/* ✅ Display Search Results */}
        {filteredResults.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map((post) => (
              <div key={post.id} className="bg-white dark:bg-gray-900 shadow-md p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{post.user}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {post.profession} at {post.company}
                </p>
                <p className="mt-2 text-gray-700 dark:text-gray-300">{post.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 mt-4">No results found.</p>
        )}
      </div>
    </Layout>
  );
};

export default Search;
