# Multi-stage build for production optimization
FROM node:24-alpine AS deps
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm ci --only=production --no-audit --no-fund

# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
# Copy package files
COPY package*.json ./
# Install all dependencies (including dev dependencies)
RUN npm ci --no-audit --no-fund
# Copy source code
COPY . .
# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Build the application
RUN npm run build

# Production stage
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set correct permissions
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]