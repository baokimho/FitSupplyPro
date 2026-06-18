FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/order-service/package.json ./apps/order-service/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm install

COPY apps/order-service/tsconfig.json ./apps/order-service/tsconfig.json
COPY apps/order-service/prisma.config.ts ./apps/order-service/prisma.config.ts
COPY apps/order-service/prisma ./apps/order-service/prisma
COPY apps/order-service/src ./apps/order-service/src
COPY packages/shared ./packages/shared

EXPOSE 3003

CMD ["npm", "--prefix", "apps/order-service", "run", "dev"]
