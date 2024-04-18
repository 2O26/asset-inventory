# # FROM node:16-alpine

# # FROM cypress/included
# FROM ubuntu:20.04

# ENV DEBIAN_FRONTEND=noninteractive

# # Install bash and jq
# # RUN apk add --no-cache \
# #     bash \
# #     curl \
# #     xvfb \
# #     dos2unix \
# #     udev \
# #     ttf-freefont \
# #     chromium \
# #     harfbuzz \
# #     nss \
# #     freetype \
# #     ttf-freefont \
# #     gtk+3.0

# # Run package updates and install packages
# RUN apt-get update && apt-get install -y bash curl dos2unix

# # Installing Node.js (including npm)
# RUN apt-get install -y nodejs npm

# RUN npm install -g cypress

# ENV CYPRESS_RUN_BINARY=/usr/bin/chromium-browser


# # Copy the script and JSON file to the image
# WORKDIR /app
# COPY . .
# RUN npm install

# RUN dos2unix start.sh

# # Set the correct CMD path
# ENTRYPOINT ["/bin/bash", "start.sh"]

FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Install prerequisites
RUN apt-get update && apt-get install -y bash curl dos2unix gnupg libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb

# Install Node.js (v18) from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Check Node.js and npm versions
RUN node --version
RUN npm --version

# Install global packages
RUN npm install -g cypress

# Copy the script and JSON file to the image
WORKDIR /app
COPY . .

# Install npm dependencies defined in package.json
RUN npm install

# Convert scripts from DOS to Unix format
RUN dos2unix start.sh

# Set the correct CMD path
ENTRYPOINT ["/bin/bash", "start.sh"]
