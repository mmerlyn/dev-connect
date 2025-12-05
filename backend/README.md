# DevConnect Backend

Express.js API for DevConnect. See the [main README](../README.md) for full documentation.

## Quick Start

```bash
npm install
docker-compose up -d    # Start PostgreSQL & Redis
cp .env.example .env    # Configure environment
npx prisma migrate dev  # Run migrations
npm run prisma:seed     # Seed data
npm run dev             # Start server
```

Runs on http://localhost:4000

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Seed database |
