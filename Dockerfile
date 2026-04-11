FROM node:23-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src/ ./src/

RUN npm run build

# ── Production stage ──────────────────────────────────
FROM node:23-alpine

WORKDIR /app

# LibreOffice for xlsx → pdf conversion
RUN apk add --no-cache libreoffice-calc font-noto font-noto-cjk \
    && rm -rf /var/cache/apk/*

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist/

# These directories are mounted as volumes
RUN mkdir -p data/holidays-cache templates output \
    && chown -R appuser:appgroup /app

USER appuser

HEALTHCHECK --interval=60s --timeout=5s --retries=3 \
  CMD node -e "process.exit(0)"

CMD ["node", "dist/index.js"]
