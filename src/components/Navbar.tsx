import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <aside className="bg-white dark:bg-gray-900 shadow-md w-64 h-screen fixed top-16 left-0 p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Navbar</h2>
      <nav className="flex flex-col space-y-4">
        <Link to="/" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          🏠 Home
        </Link>
        <Link to="/popular-posts" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          🔥 Popular Posts
        </Link>
        <Link to="/trending" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          📊 Trending
        </Link>
        <Link to="/activity" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          ✅ Your Activity
        </Link>
        <Link to="/saved" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          📌 Saved Posts
        </Link>
        <Link to="/settings" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          ⚙️ Settings
        </Link>
      </nav>
    </aside>
  );
};

export default Navbar;
