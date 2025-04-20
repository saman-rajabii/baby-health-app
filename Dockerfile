# Use Node.js LTS version as the base image
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Add package.json and package-lock.json before rest of the code for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --silent

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files from build stage to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 