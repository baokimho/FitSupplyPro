FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/payment-service/package*.json ./apps/payment-service/
COPY packages/shared/package*.json ./packages/shared/

RUN npm install

COPY apps/payment-service ./apps/payment-service
COPY packages/shared ./packages/shared

WORKDIR /app

CMD ["npm", "--prefix", "apps/payment-service", "run", "dev"]
