FROM node:16-alpine

# Install bash and jq
RUN apk add --no-cache bash jq curl

# Copy the script and JSON file to the image
COPY init.sh .
COPY react-client.json .

# Make the script executable
RUN chmod +x /init.sh

# Set the correct CMD path
CMD ["/bin/bash", "init.sh"]