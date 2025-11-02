# syntax=docker/dockerfile:1

# ---------- base (shared) ----------
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ---------- deps ----------
FROM base AS deps
WORKDIR /app
COPY package*.json ./
# install ONLY production deps so any frontend/dev packages are ignored
RUN npm ci --omit=dev

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY . .
RUN npx prisma generate && npm run build

# ---------- runner (final) ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl ca-certificates libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
EXPOSE 4000
CMD ["node","dist/src/main.js"]

# ✅ Runtime libs Prisma needs on Alpine 3.22
RUN apk add --no-cache openssl ca-certificates libc6-compat

# Bring over built app and node_modules (which include .prisma engines)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
