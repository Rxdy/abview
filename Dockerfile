# Multi-stage Dockerfile for AbView
# Build stage for frontend
FROM node:24-alpine AS frontend-builder

WORKDIR /app/client

# Copy package files
COPY client/package*.json ./

# Install dependencies
RUN npm ci --only=production

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

# Backend stage
FROM node:24-alpine AS backend

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY server/ .

# Create logs directory
RUN mkdir -p logs

EXPOSE 3333

# Default command for backend
CMD ["npm", "start"]