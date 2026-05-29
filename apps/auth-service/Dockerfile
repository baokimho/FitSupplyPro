FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/auth-service/package.json ./apps/auth-service/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN npm install

COPY apps/auth-service ./apps/auth-service
COPY packages/shared ./packages/shared

RUN npx prisma generate \
  --config apps/auth-service/prisma.config.ts \
  --schema apps/auth-service/prisma/schema.prisma
  
EXPOSE 3001

CMD ["npm", "--prefix", "apps/auth-service", "run", "dev"]