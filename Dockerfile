FROM node:22.12.0-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 9095 

CMD ["node", "--env-file=.env", "dist/src/app.js"]
