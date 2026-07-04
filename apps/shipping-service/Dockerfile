FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/shipping-service/package*.json ./apps/shipping-service/
COPY packages/shared/package*.json ./packages/shared/

RUN npm install

COPY apps/shipping-service ./apps/shipping-service
COPY packages/shared ./packages/shared

WORKDIR /app

CMD ["npm", "--prefix", "apps/shipping-service", "run", "dev"]
