# Use a base image that includes Node.js. The official Node image comes with npm.
FROM node:14

# Set the working directory in the container
WORKDIR /app

# If your project has package.json and package-lock.json, copy them to the container
# This is necessary for npm to install your dependencies, including Cypress
COPY package*.json ./

# Install dependencies, including Cypress. If you don't have a package.json,
# you'll need to create one as described below.
RUN npm install

# Copy your project files into the container
COPY . .

# The command to run your application, if applicable
CMD ["npm", "start"]
