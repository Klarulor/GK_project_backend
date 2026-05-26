FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm i

COPY . .
ENV NODE_ENV=development
WORKDIR /usr/src/app

USER node
EXPOSE 3300
CMD ["npm", "run", "start:dev"]
