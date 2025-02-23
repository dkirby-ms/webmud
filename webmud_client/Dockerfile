# Stage 1: Build the web client using Node.js
FROM node:23-alpine AS builder
WORKDIR /app
# Copy package files and install dependencies
COPY package*.json ./
RUN npm install
# Copy the rest of the application code
COPY . .
# Build the web client (adjust the build command as needed)
RUN npm run build

# Stage 2: Serve the built assets with Nginx
FROM nginx:alpine
# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*
# Copy built assets from builder stage to Nginx html folder
COPY --from=builder /app/build /usr/share/nginx/html
# Expose port 80 to serve the application
EXPOSE 80
# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]