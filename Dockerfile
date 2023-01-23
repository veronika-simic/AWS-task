#create base image
FROM node:16-alpine

#install dependencies
WORKDIR /user/app

COPY ./package.json ./
RUN npm install
COPY ./ ./

EXPOSE 4000
# comand to run 
CMD ["npm", "run", "server"]
