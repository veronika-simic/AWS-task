#create base image
FROM node:14-alpine

#install dependencies
WORKDIR /user/app

COPY ./package.json ./
RUN npm install
COPY ./ ./

# comand to run 
CMD ["npm", "start"]
