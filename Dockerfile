# Use Node.js for both building and serving
# Stage 1: Build the React Application
FROM node:20-alpine AS build

# Set working directory for the client
WORKDIR /usr/src/app/client

# Copy client package files and install dependencies
COPY client/package*.json ./
RUN npm install

# Copy the rest of the client source and build it
COPY client/ ./
RUN npm run build

# Stage 2: Create the Production Node.js Server
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Only copy the server package files to install production dependencies
COPY server/package*.json ./server/
WORKDIR /usr/src/app/server
RUN npm install --omit=dev

# Copy the rest of the server source code
COPY server/ ./

# Copy the compiled React build from Stage 1 into the production container
COPY --from=build /usr/src/app/client/dist /usr/src/app/client/dist

# Expose the API port Railway will use
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
