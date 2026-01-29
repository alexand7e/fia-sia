FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci --omit=dev

FROM base AS dev
RUN npm install
COPY . .
ENV NODE_ENV=development
EXPOSE 3003
CMD ["npm", "run", "dev"]

FROM base AS prod
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
EXPOSE 3003
CMD ["npm", "run", "start"]
