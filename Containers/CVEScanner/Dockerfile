# Build step #1
FROM node:latest
RUN npm install -g nodemon
EXPOSE 3002
WORKDIR /app

COPY package*.json ./
RUN npm install

ENV DEBUG='configHandler:*'
COPY . .
ENTRYPOINT ["npm", "start"]
# CMD ["npm", "build"]

# Build step #2
## TODO: Deploy on Alpine or NGINX