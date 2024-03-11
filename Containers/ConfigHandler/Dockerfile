# Build step #1
FROM node:latest
RUN npm install -g nodemon
EXPOSE 3001
WORKDIR /app
COPY . .
RUN npm install
ENV DEBUG='configHandler:*'

ENTRYPOINT ["npm", "start"]
# ENTRYPOINT ["npm", "run"]

# Build step #2
## TODO: Deploy on Alpine or NGINX