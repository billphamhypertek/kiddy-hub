# syntax=docker/dockerfile:1

# --- Stage 1: build the static site ---
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies from the lockfile (cached unless lockfile changes)
COPY package.json package-lock.json ./
RUN npm ci

# Build the Vite app (tsc -b && vite build -> /app/dist)
COPY . .
RUN npm run build

# --- Stage 2: serve with nginx ---
FROM nginx:alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
