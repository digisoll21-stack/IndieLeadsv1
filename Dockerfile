# STEP 1: Build Stage
FROM node:20-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy root configurations
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Copy application source
COPY apps ./apps
COPY packages ./packages

# Install dependencies and build
RUN npm install --legacy-peer-deps
RUN npm run build

# STEP 2: Runtime Stage
FROM node:20-slim AS runner

# Install runtime essentials
RUN apt-get update -y && apt-get install -y openssl tini && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Copy only what is needed from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/workers/dist ./apps/workers/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh

# Fix line endings (CRLF -> LF) for Windows users and ensure execution
RUN sed -i 's/\r$//' ./scripts/entrypoint.sh && \
  chmod +x ./scripts/entrypoint.sh && \
  chown -R node:node /app
USER node

# Expose the API port
EXPOSE 3000

# Enterprise Labeling for Coolify/Discovery
LABEL maintainer="IndieLeads Platform"
LABEL version="1.0.0"
LABEL org.opencontainers.image.description="IndieLeads Enterprise Cold Email Engine"

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })" || exit 1

ENTRYPOINT ["/usr/bin/tini", "--", "./scripts/entrypoint.sh"]

# Default command
CMD ["npm", "run", "start:api"]