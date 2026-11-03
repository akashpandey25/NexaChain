# ==============================================================================
# NexaChain Backend - Production Dockerfile
# ==============================================================================
FROM node:20-alpine AS runner

# Create application directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install dependencies (only production packages)
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
COPY src/ ./src/

# Use unprivileged built-in node user for security
USER node

# Expose backend port
EXPOSE 5000

# Container healthcheck querying /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start production server
CMD ["node", "src/server.js"]
