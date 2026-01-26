# Frontend Dockerfile
# 
# This creates a Docker image for the React PWA frontend
# Uses multi-stage build: build with Node.js, serve with nginx

# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx configuration template
# nginx:alpine automatically processes .template files in /etc/nginx/templates/
# Use environment variables: FRONTEND_PORT (default 80) and BACKEND_PORT (default 3000)
RUN echo 'server { \
    listen ${FRONTEND_PORT:-80}; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:${BACKEND_PORT:-3000}; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/templates/default.conf.template

# Expose port (default 80, can be overridden via FRONTEND_PORT env var)
EXPOSE 80

# nginx:alpine entrypoint automatically processes templates
# No need to override CMD - uses default nginx entrypoint
