FROM node:21-alpine

WORKDIR /react-app

#ENV PATH /app/node_modules/.bin:$PATH

COPY package.json ./
COPY package-lock.json ./

RUN apk add util-linux

RUN npm install
#RUN npm install react-scripts@3.4.1 -g
# taskset -c 0

COPY . ./

#RUN npm run build

#CMD ["npm", "start"]
#ENVVARS dopilit'