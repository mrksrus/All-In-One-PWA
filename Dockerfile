# All-in-One PWA Dockerfile
# 
# This creates a single Docker image that runs both frontend and backend
# Frontend is built and served as static files by the Express backend

# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
# Using npm install instead of npm ci since package-lock.json may not exist
RUN npm install

# Copy frontend source code
COPY frontend/ .

# Build the frontend (outputs to dist/)
RUN npm run build

# Stage 2: Build and run the application
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies (production only)
# Using npm install instead of npm ci since package-lock.json may not exist
RUN npm install --omit=dev

# Copy backend source code
COPY backend/ .

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/frontend/dist ./public

# Create data directory for database
RUN mkdir -p /data

# Expose port (default 3000, can be overridden via PORT env var)
EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]
