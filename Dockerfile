FROM node:18-alpine

WORKDIR /opt/app

COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3000
CMD [ "npm", "run", "start:watch" ]