# pull official base image
FROM node:21-alpine

# set working directory
WORKDIR /react-app

# add `/app/node_modules/.bin` to $PATH
#ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install --force
RUN npm install react-scripts@3.4.1 -g
RUN npm install --save react-helmet --force

# add app
COPY . ./

#RUN npm run build

# start app
#CMD ["npm", "start"]
#ENVVARS dopilit'