# DePatreon Frontend — Next.js
# Uses standalone output for smaller image

FROM node:20-alpine AS deps
RUN corepack enable pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# -----------------------------------------------------------------------------
# Build stage
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env (NEXT_PUBLIC_* baked in at build)
ARG NEXT_PUBLIC_INDEXER_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_INDEXER_API_URL=$NEXT_PUBLIC_INDEXER_API_URL

RUN pnpm run build

# -----------------------------------------------------------------------------
# Runtime stage
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
