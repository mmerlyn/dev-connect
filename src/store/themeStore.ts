import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      darkMode: localStorage.getItem("theme") === "dark", // ✅ Get initial value from localStorage
      toggleDarkMode: () => {
        const newMode = !get().darkMode;
        if (newMode) {
          document.documentElement.classList.add("dark"); // ✅ Apply dark mode
          localStorage.setItem("theme", "dark");
        } else {
          document.documentElement.classList.remove("dark"); // ✅ Apply light mode
          localStorage.setItem("theme", "light");
        }
        set({ darkMode: newMode });
      },
    }),
    {
      name: "theme-storage", // ✅ Persist theme in localStorage
    }
  )
);

export default useThemeStore;
