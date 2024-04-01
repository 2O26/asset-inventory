# Build step #1: build the React front end
FROM node:latest as build-step
# EXPOSE 3000
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV DEBUG='frontend:*'

# ENTRYPOINT [ "npm", "start" ]
RUN npm run build

# # Build step #2: build an nginx container
FROM nginx:stable-alpine
COPY --from=build-step /app/build /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]