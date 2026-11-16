# ==========================================
# Stage 1: Build Frontend and Server Bundle
# ==========================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy dependency manifests first for optimal Docker layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies required for compilation)
RUN npm ci

# Copy full application source code
COPY . .

# Compile Vite client bundle and esbuild server bundle to dist/
RUN npm run build

# ==========================================
# Stage 2: Production Lightweight Runner
# ==========================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Default production environment variables (PORT is injected by Cloud Run; defaults to 3000 in app)
ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV TRUST_PROXY=1

# Create persistent storage and backup directories and set non-root ownership
RUN mkdir -p /data /app/backups /app/dist && \
    chown -R node:node /data /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only (omits TypeScript, Vite dev plugins, etc.)
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled frontend and bundled server from builder
COPY --from=builder --chown=node:node /app/dist ./dist

# Copy maintenance CLI scripts (backup & restore)
COPY --from=builder --chown=node:node /app/scripts ./scripts

# Drop root privileges and run as non-root 'node' user
USER node

# Expose default application port
EXPOSE 3000

# Container healthcheck querying the lightweight public health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the compiled Express server (server.ts -> dist/server.cjs)
CMD ["node", "dist/server.cjs"]
