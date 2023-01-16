#create base image
FROM node:14-alpine

#install dependencies
COPY ./ ./
RUN npm install


# comand to run 
CMD ["npm", "start"]
