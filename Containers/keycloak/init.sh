#!/bin/bash

# Keycloak server URL
# KEYCLOAK_URL="http://keycloak:8085"
KEYCLOAK_URL="http://localhost:8085"

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
else
  echo "Failed to create client, server responded with HTTP status $CREATE_CLIENT_RESPONSE."
fi
