# syntax=docker/dockerfile:1

# ---- Build ----
FROM node:26-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# O postinstall (nuxt prepare) precisa do código-fonte; o nuxt build já faz esse passo
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY . .
# Lido no build pelo routeRules do nuxt.config.ts. Nos containers a API se chama "api".
ARG API_PROXY_TARGET=http://api:8080
ENV API_PROXY_TARGET=$API_PROXY_TARGET
RUN npm run build

# ---- Runtime ----
FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
