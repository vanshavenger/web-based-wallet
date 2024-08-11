FROM node:20-alpine

WORKDIR /app

COPY package* .
COPY components.json .

RUN npm install
RUN npm install @rollup/rollup-linux-arm64-musl

COPY . .

EXPOSE 5173

ENTRYPOINT ["npm","run", "dev"]