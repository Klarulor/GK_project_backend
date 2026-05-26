FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN chown -R node:node /usr/src/app
ENV NODE_ENV=development

USER node
EXPOSE 3300
CMD ["npm", "run", "start:dev"]
