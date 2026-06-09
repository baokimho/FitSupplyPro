FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/catalog-service/package.json ./apps/catalog-service/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm install


COPY apps/catalog-service ./apps/catalog-service
COPY packages/shared ./packages/shared

RUN npx prisma generate \
  --config apps/catalog-service/prisma.config.ts \
  --schema apps/catalog-service/prisma/schema.prisma

EXPOSE 3002

CMD ["npm", "--prefix", "apps/catalog-service", "run", "dev"]