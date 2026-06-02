FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/catalog-service/package.json ./apps/catalog-service/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm install

COPY apps/catalog-service/tsconfig.json ./apps/catalog-service/tsconfig.json
COPY apps/catalog-service/src ./apps/catalog-service/src
COPY packages/shared ./packages/shared

EXPOSE 3002

CMD ["npm", "--prefix", "apps/catalog-service", "run", "dev"]