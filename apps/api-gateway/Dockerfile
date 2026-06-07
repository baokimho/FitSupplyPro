FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm install

COPY apps/api-gateway/tsconfig.json ./apps/api-gateway/tsconfig.json
COPY apps/api-gateway/src ./apps/api-gateway/src
COPY packages/shared ./packages/shared

RUN npm --prefix apps/api-gateway run build

EXPOSE 3000

CMD ["npm", "--prefix", "apps/api-gateway", "run", "start"]