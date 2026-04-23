# Use the official Node.js 22 LTS image as the base image
FROM node:22-alpine

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm ci --omit=dev

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 3025 for the microservice
EXPOSE 3025

# Start the microservice using npm start command
CMD ["npm", "start"]
