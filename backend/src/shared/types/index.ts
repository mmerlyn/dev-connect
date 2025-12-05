import { Request } from 'express';
import { User } from '@prisma/client';

// Extend Express Request to include authenticated user
export interface AuthRequest extends Request {
  user?: User;
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

// Query params for pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// User without sensitive fields
export type PublicUser = Omit<User, 'password' | 'twoFactorSecret'>;

export type { User } from '@prisma/client';
