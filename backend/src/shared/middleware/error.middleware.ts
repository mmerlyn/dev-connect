import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class ErrorMiddleware {
  static handle(error: Error, req: Request, res: Response, next: NextFunction) {
    console.error('Error:', error);

    // Zod validation errors
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    // Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A record with this value already exists',
          errors: error.meta,
        });
      }

      // Record not found
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Record not found',
        });
      }
    }

    // Default error
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message,
    });
  }

  // 404 handler
  static notFound(req: Request, res: Response) {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.url} not found`,
    });
  }
}
