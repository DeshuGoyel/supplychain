# Production Backend Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /home/engine/project

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory and user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /home/engine/project

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /home/engine/project/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /home/engine/project/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /home/engine/project/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /home/engine/project/package*.json ./

# Copy public directory for file uploads
COPY --from=builder --chown=nodejs:nodejs /home/engine/project/public ./public

# Create uploads directory
RUN mkdir -p uploads && chown nodejs:nodejs uploads

# Set user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start application
CMD ["dumb-init", "node", "dist/index.js"]