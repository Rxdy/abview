# Multi-stage Dockerfile for AbView
# Build stage for frontend
FROM node:24-alpine AS frontend-builder

WORKDIR /app/client

# Copy package files
COPY client/package*.json ./

# Install ALL dependencies (including dev) for build
RUN npm ci

# Copy source code
COPY client/ .

# Build the application
RUN npm run build

# Production stage for frontend
FROM nginx:alpine AS frontend

# Copy built assets from builder stage
COPY --from=frontend-builder /app/client/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

# Backend build stage
FROM node:24-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install ALL dependencies (including dev) for compilation
RUN npm ci

# Copy source code
COPY server/ .

# Compile TypeScript to JavaScript (output goes to /app/build)
RUN node ace build && ls -la /app/build/bin/ && echo "✓ Backend build successful"

# Backend production stage
FROM node:24-alpine AS backend

WORKDIR /app

# Copy compiled output from builder
COPY --from=backend-builder /app/build ./

# Copy package files to install production deps
COPY server/package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Create logs directory
RUN mkdir -p logs

# Verify that server.js exists
RUN ls -la /app/bin/server.js || (echo "ERROR: /app/bin/server.js not found!" && exit 1)

EXPOSE 3333

# Default command for backend
CMD ["node", "bin/server.js"]