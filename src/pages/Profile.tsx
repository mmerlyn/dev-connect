import React from "react";
import Layout from "../components/Layout";
import useAuthStore from "../store/authStore";
import usePostStore from "../store/postStore";

const Profile = () => {
  const { user } = useAuthStore();
  const { posts } = usePostStore();

  return (
    <Layout>
      <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6 w-3/4 mx-auto mt-6">
        {/* Profile Header */}
        <div className="flex items-center gap-6">
          <img
            src={user?.avatar || "/default-avatar.png"}
            alt="Profile"
            className="w-24 h-24 rounded-full border border-gray-300 dark:border-gray-600"
          />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{user?.name || "User Name"}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user?.profession || "Your Profession"} at {user?.company || "Company Name"}</p>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bio</h3>
          <p className="text-gray-600 dark:text-gray-400">{user?.bio || "No bio available."}</p>
        </div>

        {/* Skills Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Skills</h3>
          <div className="flex gap-2 flex-wrap">
            {user?.skills && user.skills.length > 0 ? (
              user.skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No skills added.</p>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact</h3>
          <p className="text-gray-600 dark:text-gray-400">📧 {user?.email || "No email provided"}</p>
          <p className="text-gray-600 dark:text-gray-400">💻 <a href={user?.github} className="text-blue-500 dark:text-blue-300 hover:underline">GitHub Profile</a></p>
        </div>

        {/* Follow & Bookmark */}
        <div className="flex gap-4 mt-6">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">Follow</button>
          <button className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition">Bookmark</button>
        </div>

        {/* Recent Posts Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Posts</h3>
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {posts.slice(0, 3).map((post) => (
                <div key={post.id} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow">
                  <p className="text-gray-800 dark:text-white">{post.content}</p>
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <span>👍 {post.likes} Likes</span>
                    <span>💬 {post.comments} Comments</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 mt-2">No posts yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
