# Backend Dockerfile
# 
# This creates a Docker image for the Node.js backend API

# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create data directory for database
RUN mkdir -p /data

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/server.js"]
