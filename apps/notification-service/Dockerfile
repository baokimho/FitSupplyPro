FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/notification-service/package*.json ./apps/notification-service/
COPY packages/shared/package*.json ./packages/shared/

RUN npm install

COPY apps/notification-service ./apps/notification-service
COPY packages/shared ./packages/shared

WORKDIR /app

CMD ["npm", "--prefix", "apps/notification-service", "run", "dev"]
