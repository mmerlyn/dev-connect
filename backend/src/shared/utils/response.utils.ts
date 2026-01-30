import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/index.js';

export class ResponseUtils {
  // Success response
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  // Error response
  static error(res: Response, message: string, statusCode: number = 400, errors?: any) {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
    };
    return res.status(statusCode).json(response);
  }

  // Paginated response
  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    statusCode: number = 200
  ) {
    const response: PaginatedResponse<T> = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
    return res.status(statusCode).json(response);
  }

  // Created response
  static created<T>(res: Response, data: T, message?: string) {
    return this.success(res, data, message, 201);
  }

  // No content response
  static noContent(res: Response) {
    return res.status(204).send();
  }

  // Unauthorized response
  static unauthorized(res: Response, message: string = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  // Forbidden response
  static forbidden(res: Response, message: string = 'Forbidden') {
    return this.error(res, message, 403);
  }

  // Not found response
  static notFound(res: Response, message: string = 'Resource not found') {
    return this.error(res, message, 404);
  }

  // Bad request response
  static badRequest(res: Response, message: string = 'Bad request') {
    return this.error(res, message, 400);
  }

  // Internal server error
  static serverError(res: Response, message: string = 'Internal server error') {
    return this.error(res, message, 500);
  }
}
