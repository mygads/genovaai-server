# ===================================================================================
# GENOVAAI SERVER - DOCKERFILE
# ===================================================================================
#
# Production-ready, security hardened Docker image
# For development, use: npm run dev (tanpa Docker)
#
# BUILD:
#   docker build -t genovaai-server .
#
# ===================================================================================

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm ci

COPY . .

# Dummy DATABASE_URL for prisma generate (schema validation only, no real DB needed)
# prisma migrate deploy is skipped here - it runs at deploy time via CI/CD or deploy script
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate && npx next build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install only dumb-init (no wget/curl for security)
RUN apk add --no-cache dumb-init \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --shell /sbin/nologin nextjs

# Remove dangerous binaries
RUN rm -f /usr/bin/wget /usr/bin/curl /usr/bin/nc /usr/bin/telnet 2>/dev/null || true

# Copy built assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=nextjs:nodejs healthcheck.js /app/healthcheck.js

# Create uploads directory for knowledge files
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["dumb-init", "--"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD ["node", "/app/healthcheck.js"]

CMD ["node", "server.js"]
