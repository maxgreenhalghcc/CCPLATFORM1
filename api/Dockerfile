# syntax=docker/dockerfile:1

# ---------- base (shared) ----------
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ---------- deps ----------
FROM base AS deps
COPY package*.json ./
# Use ci for reproducible installs; swap to `npm install` if you prefer
RUN npm ci --omit=dev

# ---------- build ----------
FROM deps AS build
COPY . .
# Generate Prisma client (with musl binaries) and build Nest
RUN npx prisma generate && npm run build

# ---------- runner (final) ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# ✅ Runtime libs Prisma needs on Alpine 3.22
RUN apk add --no-cache openssl ca-certificates libc6-compat

# Bring over built app and node_modules (which include .prisma engines)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
