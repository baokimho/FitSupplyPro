FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY apps/auth-service/package.json ./apps/auth-service/package.json
COPY apps/catalog-service/package.json ./apps/catalog-service/package.json
COPY apps/inventory-service/package.json ./apps/inventory-service/package.json
COPY apps/order-service/package.json ./apps/order-service/package.json
COPY apps/cart-service/package.json ./apps/cart-service/package.json
COPY apps/payment-service/package.json ./apps/payment-service/package.json
COPY apps/shipping-service/package.json ./apps/shipping-service/package.json
COPY apps/notification-service/package.json ./apps/notification-service/package.json
COPY packages/shared/package.json ./packages/shared/package.json


RUN npm install

COPY apps/shipping-service ./apps/shipping-service
COPY packages/shared ./packages/shared

WORKDIR /app

CMD ["npm", "--prefix", "apps/shipping-service", "run", "dev"]
