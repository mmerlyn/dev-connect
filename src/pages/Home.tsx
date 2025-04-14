import React from "react";
import Layout from "../components/Layout";
import usePostStore from "../store/postStore";

const Home = () => {
  const { posts } = usePostStore(); // ✅ Fetch posts from Zustand

  return (
    <Layout>
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <textarea
          placeholder="What's on your mind?"
          className="w-full p-3 border rounded-md"
        />
        <button className="mt-2 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition">
          Create Post
        </button>
      </div>

      {/* Posts Feed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white shadow-md p-4 rounded-lg flex flex-col">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">{post.user}</h2>
                <p className="text-sm text-gray-500">{post.profession} at {post.company}</p>
              </div>
              <button className="text-blue-500 hover:text-blue-600">Follow</button>
            </div>
            <p className="mt-2 text-gray-700">{post.content}</p>
            <div className="flex justify-between mt-3 text-gray-600">
              <button>👍 {post.likes} Like</button>
              <button>💬 {post.comments} Comment</button>
              <button>🔄 Share</button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Home;
