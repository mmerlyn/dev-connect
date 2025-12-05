export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PROFILE: '/profile/:username',
  MESSAGES: '/messages',
  SETTINGS: '/settings',
  SEARCH: '/search',
  NOTIFICATIONS: '/notifications',
  HASHTAG: '/hashtag/:tag',
  POST: '/post/:id',
} as const;

export const getProfileRoute = (username: string) => `/profile/${username}`;
export const getMessagesRoute = (userId?: string) =>
  userId ? `/messages?user=${userId}` : '/messages';
export const getHashtagRoute = (tag: string) => `/hashtag/${tag}`;
export const getPostRoute = (postId: string) => `/post/${postId}`;
