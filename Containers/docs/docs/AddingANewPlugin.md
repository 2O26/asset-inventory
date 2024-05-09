# Adding a new plugin to the asset inventory system
Adding a new plugin for the asset inventory system consists of two parts:
1. Creating a backend microservice that performs the desired functionality.
2. Integrating a user interface with the frontend code to display the new plugin info

## Suggested workflow when adding a new plugin
1. Write your Dockerfile for your new microservice
2. Write the code for the microservice
3. Add the two microservices to the docker-compose file and add build commands in the makefile
4. Add your frontend component that will interact with the microservice

## Integrating plugin with frontend microservice

### Frontend framework
The frontend framework used is Reactjs.

[https://react.dev/learn](URL)

### Creating a new component
Create compenent in the place you want to add a new component in the frontend. Import it.

If you want to make a route to your component you can do so in App.js.

### API Service
All API calls to the backend are stored in a single file, namely *APIservive.js*. *APIservice.js* is a file where all the API calls outside the frontend microservice are called from.

The decision to centralize was motived by:

1. **Centralization of Network Logic**: By keeping all API calls in one file, developers centralize the network communication logic. This centralization makes it easier to manage the interactions with backend services, as there is a single point of reference for all outbound network requests. It simplifies the task of updating endpoints, adjusting headers, or modifying request parameters.
2. **Consistency in Handling API Requests**: With a centralized approach, it's easier to ensure consistency across various API requests. Developers can uniformly handle aspects like setting headers, configuring timeouts, and managing error handling. This consistency reduces the risk of discrepancies that might occur when API logic is scattered across multiple files or components.
3. **Simplifies Debugging and Maintenance**: When all API calls are located in one file, it simplifies the debugging process. Developers can quickly locate network-related issues without searching through multiple files. Maintenance becomes more straightforward as updates, like changing an API base URL or modifying request logic, can be done in a single location.
4. **Enhanced Reusability**: A single file with all API calls encourages reusability of code. Functions or classes designed to handle API requests can be easily reused across different parts of the application. This not only speeds up the development process but also ensures that enhancements or bug fixes benefit all parts of the application using those API interactions.
5. **Facilitates Security Enhancements**: Centralizing API calls helps in enforcing security measures consistently, such as adding authentication headers or tokens. Having a single file to audit and update reduces the complexity of implementing security best practices across all API interactions.

### User Service

This JavaScript module integrates Keycloak, a popular open-source Identity and Access Management (IAM) solution, into a React application to manage user authentication and authorization. It configures a Keycloak instance, provides methods for user authentication processes, and exposes user profile and role information. This setup is ideal for applications that require secure user authentication and role-based access control.

### Configuration

##### **`initOptions`**
Configuration settings for the Keycloak instance, including the URL of the Keycloak server, the realm, and the client identifier.
##### **`_kc`**
A new Keycloak instance created using the configuration options.

#### Functions

##### `initKeycloak(onAuthenticatedCallback)`
- Initializes the Keycloak instance with options such as `onLoad` and `pkceMethod`.
- `onLoad: 'login-required'` forces the user to login immediately if not logged in. Alternatively, `check-sso` would silently check for an existing login.
- `checkLoginIframe`: Enables or disables the iframe that checks if the user is still logged in.
- Calls `onAuthenticatedCallback` if the user is authenticated.
- Logs an error to the console if authentication fails or an error occurs.

###### `doLogin` and `doLogout`
- Handle user login and logout, respectively, using Keycloak's built-in methods.

##### `getToken()` and `getTokenParsed()`
- Retrieve the raw authentication token or its parsed JSON representation. The parsed token includes user details and roles.

##### `isLoggedIn()`
- Checks if the user's token exists, indicating they are logged in.

##### `tokenExpired()`
- Checks if the user's authentication token has expired.

##### `updateToken(successCallback)`
- Attempts to refresh the token if it's near expiry (within 30 seconds as configured). If unsuccessful, it triggers a login.
- Executes `successCallback` if the token update is successful.

##### `getUsername()`, `getFirstname()`, `getLastname()`, `getEmail()`, `getRoles()`
- Retrieve respective user details from the parsed token, such as username, first name, last name, email, and assigned roles within the realm.

##### `hasRole(roles)`
- Checks if the user has any of the specified roles. Useful for implementing role-based access control within the application.

#### Benefits

- **Centralized Authentication Management**: By using Keycloak, the application offloads the complex tasks of user authentication and session management, focusing more on business logic.
- **Security**: Keycloak provides robust security features like secure login, session management, and token handling without extensive custom coding.
- **Scalability**: Easily manage user roles and access levels as your user base grows.
- **Simplicity**: The API methods provided allow for simple integration with frontend components, enabling reactive updates based on user authentication state.
- **Reusability**: The encapsulation of authentication logic into a single module makes it reusable across different parts of the application or even in different applications within the same realm.

#### Usage

The `UserService` object packages all the functions, making it easy to import and use within React components. This service provides a straightforward interface for handling authentication-related operations, enhancing the application's maintainability and clarity.


### useMutate and useQuery
To make handling of state variables/frames in reactjs useMutate and useQuery was used.

#### useQuery
Pros:
- Automatic Caching and Background Updates: Automatically caches data and supports background updates, enhancing UI performance and user experience without manual intervention.
- Built-in Loading and Error States: Provides default handling for loading and error states, simplifying UI state management throughout the data fetching lifecycle.
- DevTools Integration: Offers developer tools that help manage and debug queries, view statuses, and inspect cached data.
- Configuration Options: Includes extensive configuration options like retries, refetch intervals, and control over stale times, allowing fine-tuning for various use cases.

Cons:
- Complexity for Simple Use Cases: Can introduce unnecessary complexity and overhead in projects with minimal data fetching needs.
- Learning Curve: The library's comprehensive features require a learning period, potentially slowing initial development.
- Dependency Overhead: Adds an additional library dependency, which may be excessive for projects with limited external data interactions.

#### useMutation
Pros:
- Simplified Data Mutation: Manages the mutation lifecycle (loading, success, error), integrates with useQuery for cache updates, and simplifies server data updating.
- Optimistic Updates: Enables optimistic UI updates before server response, improving responsiveness.
- Cache Integration: Automatically updates or invalidates related queries post-mutation, ensuring UI consistency with server state.
- Asynchronous Support: Supports asynchronous mutation functions, which facilitates the use of async/await in server interactions.

Cons:
- Potential Over-fetching: Improper configuration may lead to excessive refetching of related queries, increasing server load.
- Error Handling Complexity: Handling errors, especially with optimistic updates, can become complex as it might require rolling back UI changes on mutation failures.
- Setup Complexity: Initial setup can be intricate due to the need for integrating mutation effects with query caching and invalidation mechanisms.
