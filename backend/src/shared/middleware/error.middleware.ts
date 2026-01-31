import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export class ErrorMiddleware {
  static handle(error: Error, _req: Request, res: Response, _next: NextFunction) {
    console.error('Error:', error);

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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A record with this value already exists',
          errors: error.meta,
        });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Record not found',
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  }

  static notFound(req: Request, res: Response) {
    res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.url} not found`,
    });
  }
}
