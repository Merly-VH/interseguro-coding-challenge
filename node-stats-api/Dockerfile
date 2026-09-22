FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app ./

USER node
EXPOSE 3000
CMD ["node", "index.js"]
