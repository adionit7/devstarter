# ── Stage 1: Build the React app ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --silent

COPY . .
RUN npm run build
# Output is in /app/dist

# ── Stage 2: Serve with lightweight static server ─────────────────────────────
# Interview tip: We don't need Node at runtime — just a static file server.
# nginx:alpine is ~23MB vs node:20-alpine at ~130MB.
FROM nginx:alpine AS runtime

# Copy built files to nginx's serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config to handle React Router (SPA) correctly
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
