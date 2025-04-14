import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  name: string;
  avatar: string;
  profession: string;
  company: string;
  email: string;
  github: string;
  bio: string;
  skills: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: {
        name: "John Doe",
        avatar: "/default-avatar.png",
        profession: "Frontend Developer",
        company: "Google",
        email: "johndoe@example.com",
        github: "https://github.com/johndoe",
        bio: "Passionate about web development and open source.",
        skills: ["React", "Next.js", "TypeScript"],
      },
      isAuthenticated: true,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage", // ✅ Saves user data across sessions
    }
  )
);

export default useAuthStore;
