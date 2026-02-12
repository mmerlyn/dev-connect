declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends Omit<import('@prisma/client').User, never> {}
  }
}

export {};
