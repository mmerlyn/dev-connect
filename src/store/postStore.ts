import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Post {
  id: number;
  user: string;
  profession: string;
  company: string;
  content: string;
  likes: number;
  comments: number;
}

interface PostState {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
}

const usePostStore = create<PostState>()(
  persist(
    (set) => ({
      posts: [
        {
          id: 1,
          user: "John Doe",
          profession: "Frontend Developer",
          company: "Google",
          content: "🚀 Just launched a new project using Next.js!",
          likes: 15,
          comments: 4,
        },
        {
          id: 2,
          user: "Jane Smith",
          profession: "Backend Engineer",
          company: "Amazon",
          content: "🌟 Exploring the power of AI with TensorFlow.js!",
          likes: 22,
          comments: 5,
        },
        {
          id: 3,
          user: "Mike Johnson",
          profession: "Full Stack Dev",
          company: "Microsoft",
          content: "🔥 Learning Rust for system programming!",
          likes: 30,
          comments: 10,
        },
      ],
      setPosts: (posts) => set({ posts }),
    }),
    {
      name: "post-storage", // ✅ Ensures posts persist across page reloads
    }
  )
);

export default usePostStore;
