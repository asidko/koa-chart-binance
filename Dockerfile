# Use Node.js Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "main.js"]