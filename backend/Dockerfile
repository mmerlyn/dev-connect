# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Without OpenSSL present, Prisma can't detect the runtime's actual OpenSSL
# version at generate time and silently defaults to guessing 1.1.x — which
# then mismatches the production stage's real OpenSSL 3.0.x (Debian
# bookworm) and fails at startup with "could not locate the Query Engine".
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev for build)
RUN npm ci --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Install runtime dependencies for native modules
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --legacy-peer-deps --only=production

# Reuse the client generated in the builder stage rather than running
# `prisma generate` again here: this stage's node_modules has no `prisma`
# CLI (it's a devDependency, excluded by --only=production), so a bare
# `npx prisma generate` would silently fetch whatever "latest" is on the
# registry instead of the version this project is pinned to — which broke
# outright once registry-latest moved to a Prisma major version with an
# incompatible schema format.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:8080/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start server
CMD ["node", "dist/server.js"]
