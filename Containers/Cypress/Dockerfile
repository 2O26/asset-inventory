FROM cypress/base

# Update package index and install curl
RUN apt-get update && apt-get install -y --no-install-recommends curl

# Set the working directory
WORKDIR /app

# Copy the local files into the Docker image
COPY . .

# Install Cypress and other npm dependencies
RUN npm install
RUN npm install cypress -g

# Set the correct CMD path
ENTRYPOINT ["/bin/bash", "start.sh"]
