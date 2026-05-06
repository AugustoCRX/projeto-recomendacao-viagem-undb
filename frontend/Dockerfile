# syntax=docker/dockerfile:1.6

# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instala dependências primeiro (melhor cache de camadas)
COPY package.json package-lock.json ./
RUN npm ci

# Variáveis Vite são embutidas no bundle em tempo de build
ARG VITE_API_BASE_URL=""
ARG VITE_USE_BACKEND="true"
ARG VITE_MOCK_AUTH="false"

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_USE_BACKEND=$VITE_USE_BACKEND \
    VITE_MOCK_AUTH=$VITE_MOCK_AUTH

COPY . .
RUN npm run build

# ── Stage 2: serve ───────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
