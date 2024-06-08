FROM node:21-alpine

WORKDIR /react-app

#ENV PATH /app/node_modules/.bin:$PATH

COPY package.json ./
COPY package-lock.json ./

RUN apk add util-linux

RUN taskset -c 0 npm install --no-audit --fetch-timeout=600000
#RUN npm install react-scripts@3.4.1 -g

COPY . ./

#RUN npm run build

#CMD ["npm", "start"]
#ENVVARS dopilit'