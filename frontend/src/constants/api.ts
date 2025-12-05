export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
  },

  // Users
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
    FOLLOW: (id: string) => `/users/${id}/follow`,
    FOLLOWERS: (id: string) => `/users/${id}/followers`,
    FOLLOWING: (id: string) => `/users/${id}/following`,
  },

  // Posts
  POSTS: {
    BASE: '/posts',
    BY_ID: (id: string) => `/posts/${id}`,
    LIKE: (id: string) => `/posts/${id}/like`,
    LIKES: (id: string) => `/posts/${id}/likes`,
    COMMENTS: (id: string) => `/posts/${id}/comments`,
  },

  // Comments
  COMMENTS: {
    BY_ID: (id: string) => `/comments/${id}`,
    REPLY: (id: string) => `/comments/${id}/reply`,
    REPLIES: (id: string) => `/comments/${id}/replies`,
    LIKE: (id: string) => `/comments/${id}/like`,
  },

  // Messages
  MESSAGES: {
    CONVERSATIONS: '/messages/conversations',
    BY_USER: (userId: string) => `/messages/${userId}`,
    BASE: '/messages',
    MARK_READ: (id: string) => `/messages/${id}/read`,
    DELETE: (id: string) => `/messages/${id}`,
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id: string) => `/notifications/${id}`,
  },

  // Feed
  FEED: {
    BASE: '/feed',
    TRENDING: '/feed/trending',
    FOLLOWING: '/feed/following',
  },

  // Search
  SEARCH: {
    BASE: '/search',
    USERS: '/search/users',
    POSTS: '/search/posts',
    HASHTAGS: '/search/hashtags',
    BY_HASHTAG: (tag: string) => `/search/hashtag/${tag}`,
  },
} as const;
