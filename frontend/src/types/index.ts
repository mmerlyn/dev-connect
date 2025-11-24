// User types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  banner?: string;
  skills: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  location?: string;
  createdAt: string;
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

// Post types
export interface Post {
  id: string;
  content: string;
  codeSnippet?: string;
  language?: string;
  images: string[];
  hashtags: string[];
  views: number;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  parentId?: string;
  _count: {
    likes: number;
    replies: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Message types
export interface Message {
  id: string;
  content: string;
  read: boolean;
  senderId: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  recipientId: string;
  createdAt: string;
}

export interface Conversation {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    lastActive: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

// Notification types
export type NotificationType = 'LIKE_POST' | 'LIKE_COMMENT' | 'COMMENT_POST' | 'REPLY_COMMENT' | 'FOLLOW' | 'MENTION';

export interface Notification {
  id: string;
  type: NotificationType;
  content: string;
  read: boolean;
  postId?: string;
  commentId?: string;
  recipientId: string;
  senderId?: string;
  sender?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
