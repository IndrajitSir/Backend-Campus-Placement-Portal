# Backend — Campus Placement API (Express + Mongoose + Socket.io)
# DEV image: keeps devDependencies (nodemon) and runs with hot reload.
# docker-compose.yml bind-mounts ./src into the container for live edits.
# node:20-slim (glibc) is used instead of alpine so the bcrypt native module
# installs cleanly without needing build toolchains.

FROM node:20-slim

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install

# Copy the application source (overridden at runtime by the bind mount)
COPY . .

EXPOSE 6005

# `npm run dev` = nodemon -r dotenv/config --experimental-json-modules src/index.js
CMD ["npm", "run", "dev"]
