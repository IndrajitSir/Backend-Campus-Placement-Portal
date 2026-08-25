# Backend — Campus Placement API (Express + Mongoose + Socket.io)
# node:20-slim (glibc) is used instead of alpine so the bcrypt native module
# installs cleanly without needing build toolchains.

FROM node:20-slim

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install

# Copy the application source
COPY . .

EXPOSE 6005

# `npm start` runs `node -r dotenv/config src/index.js`. Any .env file in the
# image is ignored (see .dockerignore); runtime config comes from environment
# variables passed by docker-compose, which take precedence over .env.
CMD ["npm", "start"]

# FOR PRODUCTION
# FROM node:22-alpine

# WORKDIR /app

# COPY package*.json ./

# RUN npm ci --omit=dev

# COPY . .

# ENV NODE_ENV=production

# EXPOSE 6005

# CMD ["npm", "start"]