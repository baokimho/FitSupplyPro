FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/cart-service/package.json ./apps/cart-service/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm install

COPY apps/cart-service ./apps/cart-service
COPY packages/shared ./packages/shared

RUN npx prisma generate \
  --config apps/cart-service/prisma.config.ts \
  --schema apps/cart-service/prisma/schema.prisma

EXPOSE 3005

CMD ["npm", "--prefix", "apps/cart-service", "run", "dev"]
