# Stage 1: Build the web client using Node.js
FROM node:23

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx auth secret

RUN npm run build

EXPOSE 28999

CMD ["npm", "start"]