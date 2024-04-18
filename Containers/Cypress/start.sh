#!/bin/bash

# Keycloak server URL
KEYCLOAK_URL="http://keycloak:8085/health"
FRONTEND_URL="http://frontenddev:3000"

# Initial message indicating what the script is waiting for
echo "Waiting for the service to be ready..."

# Loop indefinitely until the curl command returns a 200 status code
while true; do
  # Use curl to get the HTTP status code
    STATUS_CODE_KC=$(curl --head --silent --output /dev/null --write-out "%{http_code}" "$KEYCLOAK_URL")
    STATUS_CODE_FE=$(curl --head --silent --output /dev/null --write-out "%{http_code}" "$FRONTEND_URL")

  # Check if the status code is 200
if [[ "$STATUS_CODE_KC" -eq 200 && "$STATUS_CODE_FE" -eq 200 ]]; then
    echo -e "Service is up and ready. Status codes: \nKeycloak: $STATUS_CODE_KC \nFrontend: $STATUS_CODE_FE"
    break # Exit the loop if the service is ready
  else
    echo -e "Service is not ready yet, status codes:\nKeycloak: $STATUS_CODE_KC \nFrontend: $STATUS_CODE_FE.\nRetrying in 5 seconds..."
    sleep 5 # Wait for 5 seconds before retrying
  fi
done

# Running Cypress tests
npx cypress run
