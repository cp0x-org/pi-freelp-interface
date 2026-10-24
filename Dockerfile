# syntax=docker/dockerfile:1
# Build stage: the output is static files, so it runs on the build host's
# platform even for multi-arch images (see build.sh).
FROM --platform=$BUILDPLATFORM oven/bun:1.4.0 AS build
# Accepted for build.sh compatibility; vite.config.ts uses a relative base.
ARG VITE_APP_BASE_NAME=/
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun x tsc --noEmit && bun x vite build

# Runtime stage: only the static build and the config-driven server.
FROM oven/bun:1.4.0-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY docker/server.ts ./server.ts
# Default config; mount your own config.json over it (see docker-compose.yml).
COPY config.example.json ./config.json
USER bun
EXPOSE 4173
CMD ["bun", "server.ts", "--config", "/app/config.json"]
