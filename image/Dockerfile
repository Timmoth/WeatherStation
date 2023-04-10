FROM node:alpine
RUN apk update
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run compile
EXPOSE 3000
CMD [ "npx", "serverless", "offline", "--host", "0.0.0.0", "--stage", "local", "--noPrependStageInUrl" ]
