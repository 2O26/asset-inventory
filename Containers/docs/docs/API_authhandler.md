# Documentation for Authentication and Role Management Service

This service provides REST API endpoints for authentication and role management, using JWTs verified against a public key from a JWKS endpoint. It's designed to be secure, reliable, and easy to integrate with other services requiring user authentication and role checks.

## Overview

The service includes endpoints for checking the server status, retrieving user identifiers, and extracting role information from JWTs. It is built using Express.js and leverages the `jsonwebtoken` and `jwks-rsa` libraries to handle JWT verification.

## Getting Started

### Dependencies

- **Express**: Framework for handling HTTP requests.
- **jsonwebtoken**: Library to issue and verify JWTs.
- **jwks-rsa**: Library to retrieve RSA signing keys from a JWKS (JSON Web Key Set) endpoint.
- **CORS**: Middleware to enable CORS.

### Setup

1. Initialize the Express application.
2. Use JSON middleware for parsing application/json.
3. Use CORS middleware to handle cross-origin requests.

### Running the Server

The server listens on port 3003, configurable through the `route` variable. It logs a confirmation message upon successful startup.

## API Endpoints

### `GET /status`

Returns a simple text response to check the server's status.

- **Response**: `"Check Status"`

### `GET /getUID`

Verifies the JWT from the `Authorization` header and returns the user's unique identifier.

- **Headers**:
  - `Authorization`: Bearer token containing the JWT.

- **Success Response**:
  - **Code**: 200
  - **Content**: `{ "authenticated": true, "userID": "user's unique identifier" }`

- **Error Response**:
  - **Code**: 401 Unauthorized
  - **Content**: `{ "authenticated": false, message: 'Invalid token' }`

- **Logic**:
  1. Extracts the JWT from the `Authorization` header.
  2. Verifies the JWT using the public key retrieved from the JWKS URI.
  3. Checks for the presence of the `sub` claim to return as the userID.

### `GET /getRoles`

Extracts and returns the roles from the JWT, including subnet roles and permissions like admin access and asset management capabilities.

- **Headers**:
  - `Authorization`: Bearer token containing the JWT.

- **Success Response**:
  - **Code**: 200
  - **Content**: `{ "authenticated": true, "roles": ["IP subnet roles"], "isAdmin": true/false, "canManageAssets": true/false }`

- **Error Response**:
  - **Code**: 401 Unauthorized
  - **Content**: `{ "authenticated": false, message: 'Invalid token' }`

- **Logic**:
  1. Verifies the JWT and decodes it to extract the `realm_access.roles`.
  2. Filters roles to determine subnet access and administrative capabilities.
  3. Responds with the roles associated with the user.

## Security

- **JWT Verification**: The service verifies JWTs against a public key obtained from a JWKS URI provided by an identity provider.
- **Error Handling**: All API endpoints include error handling to gracefully manage and log authentication errors.
- **CORS Settings**: Configurable to restrict cross-origin requests to trusted domains only.

## Conclusion

This service is integral for securing backend services by ensuring that all incoming requests are authenticated and authorized, thereby maintaining data integrity and security.

