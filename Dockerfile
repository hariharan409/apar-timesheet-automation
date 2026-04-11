FROM node:23-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src/ ./src/

RUN npm run build

# ── Production stage ──────────────────────────────────
FROM node:23-slim

WORKDIR /app

# LibreOffice for xlsx → PDF conversion (auto-detected at runtime)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libreoffice-calc fonts-noto-core \
    && rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist/

# These directories are mounted as volumes
RUN mkdir -p data/holidays-cache templates output \
    && chown -R appuser:appgroup /app

USER appuser

HEALTHCHECK --interval=60s --timeout=5s --retries=3 \
  CMD node -e "process.exit(0)"

CMD ["node", "dist/index.js"]
