# Stage 1: Build the web client using Node.js
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 28999

CMD ["npm", "start"]