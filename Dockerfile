FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm prune --omit=dev && npm cache clean --force


FROM node:20-alpine AS production

RUN apk --no-cache add curl

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json

USER node
EXPOSE 3300
CMD ["node", "dist/main"]
