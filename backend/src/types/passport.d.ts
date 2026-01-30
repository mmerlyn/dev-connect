import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface User extends Omit<import('@prisma/client').User, never> {}
  }
}

export {};
