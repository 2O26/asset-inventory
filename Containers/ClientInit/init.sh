#!/bin/bash

# Keycloak server URL
KEYCLOAK_URL="http://keycloak:8085"

# Initial message indicating what the script is waiting for
echo "Waiting for the service to be ready..."

# Loop indefinitely until the curl command returns a 200 status code
while true; do
  # Use curl to get the HTTP status code
  STATUS_CODE=$(curl --head --silent --output /dev/null --write-out "%{http_code}" http://keycloak:8085/health)

  # Check if the status code is 200
  if [ "$STATUS_CODE" -eq 200 ]; then
    echo "Service is up and ready."
    break # Exit the loop if the service is ready
  else
    echo "Service is not ready yet, status code: $STATUS_CODE. Retrying in 5 seconds..."
    sleep 5 # Wait for 5 seconds before retrying
  fi
done


# Admin credentials
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"

# Realm where the client should be created
REALM_NAME="master"

# Client JSON configuration
CLIENT_CONFIG=$(<react-client.json)

# echo ("$CLIENT_CONFIG")

# Fetch the admin access token
ACCESS_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
   -H "Content-Type: application/x-www-form-urlencoded" \
   -d "username=$ADMIN_USER" \
   -d "password=$ADMIN_PASSWORD" \
   -d "grant_type=password" \
   -d "client_id=admin-cli" | jq -r '.access_token')

# Exit if we don't get the access token
if [ "$ACCESS_TOKEN" = "null" ]; then
  echo "Failed to obtain access token."
  exit 1
fi

# # Use the token to create a new client
CREATE_CLIENT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/clients" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$CLIENT_CONFIG")

# # Check if the client was created successfully
if [ "$CREATE_CLIENT_RESPONSE" = "201" ]; then
  echo "Client successfully created."
elif [ "$CREATE_CLIENT_RESPONSE" = "409" ]; then
  echo "Client already created."
else
  echo "Failed to create client, server responded with HTTP status $CREATE_CLIENT_RESPONSE."
fi

# User data
USER_DATA='{"firstName":"Test","lastName":"Testsson", "username":"test@email.com" ,"email":"test@email.com", "enabled":"true", "credentials":[{"type":"password","value":"passwd","temporary":false}]}'

# Use the token to create a new user
CREATE_USER_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$USER_DATA")

# # Check if the user was created successfully
if [ "$CREATE_USER_RESPONSE" = "201" ]; then
  echo "User successfully created."
elif [ "$CREATE_USER_RESPONSE" = "409" ]; then
  echo "User already created."
else
  echo "Failed to create user, server responded with HTTP status $CREATE_USER_RESPONSE."
fi

ROLE_DATA='{"name":"manage-assets", "description": "Can manage assets (remove and edit assets)"}'

CREATE_ROLE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$KEYCLOAK_URL/admin/realms/$REALM_NAME/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$ROLE_DATA")

# # Check if the user was created successfully
if [ "$CREATE_ROLE_RESPONSE" = "201" ]; then
  echo "Role successfully created."
elif [ "$CREATE_ROLE_RESPONSE" = "409" ]; then
  echo "Role already created."
else
  echo "Failed to create role, server responded with HTTP status $CREATE_ROLE_RESPONSE."
fi
