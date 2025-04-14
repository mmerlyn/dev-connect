import React from "react";
import { Link } from "react-router-dom";
import useSearchStore from "../store/searchStore";
import useThemeStore from "../store/themeStore";
import { useEffect } from "react";

const Header = () => {
  const { query, setQuery } = useSearchStore();
  const { darkMode, toggleDarkMode } = useThemeStore();

  useEffect(() => {
    // ✅ Ensure dark mode is applied when the page loads
    if (localStorage.getItem("theme") === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value.toLowerCase());
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md p-4 flex items-center justify-between w-full fixed top-0 left-0 z-50">
      {/* ✅ App Icon & Name */}
      <Link to="/" className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
        <span className="mr-2">🚀</span> DevConnect
      </Link>

      {/* ✅ Centered Search Bar */}
      <div className="relative w-1/3 flex items-center">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search developers..."
          className="w-full p-2 pl-4 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none"
        />
        <button className="absolute right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition">
          🔍
        </button>
      </div>

      {/* ✅ Icons Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition">
          🔔
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>

        {/* Profile */}
        <Link to="/profile" className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white transition">
          👤 Profile
        </Link>
      </div>
    </header>
  );
};

export default Header;
