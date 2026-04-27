# Use the official Node.js 22 LTS Alpine image
FROM node:22-alpine

# Set the working directory to /app
WORKDIR /app

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install production dependencies only using clean install
RUN npm ci --omit=dev

# Copy only the application source code
COPY src/ ./src/

# Switch to non-root user
USER appuser

# Expose port 3025 for the microservice
EXPOSE 3025

# Start the microservice
CMD ["node", "src/app.js"]
