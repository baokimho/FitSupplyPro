FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/inventory-service/package.json ./apps/inventory-service/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm install

COPY apps/inventory-service ./apps/inventory-service
COPY packages/shared ./packages/shared

RUN npx prisma generate \
  --config apps/inventory-service/prisma.config.ts \
  --schema apps/inventory-service/prisma/schema.prisma

EXPOSE 3004

CMD ["npm", "--prefix", "apps/inventory-service", "run", "dev"]
