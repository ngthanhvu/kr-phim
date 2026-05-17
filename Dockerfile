FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3002
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3002

COPY --from=builder /app/.output ./.output

EXPOSE 3002
CMD ["node", ".output/server/index.mjs"]
