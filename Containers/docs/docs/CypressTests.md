## Run tests localy on your machine

### Prerequisits

You will need to insall NPM and cypress. Enter `Containers/Cypress/` and run:

```bash
npm install
```

and

```bash
npm install cypress -g
```


### Cypress commands

To run tests in terminal mode:
```
npm cy:run
```
To run tests in browser mode:
```
npm cy:spectate
```


## CI-CD Pipeline and Test Container:

To make the cypress tests work inside the pipeline/test container you need to change the following thigs:

1. Inside the file `Containers/Cypress/cypress.env.json` change:

```json
{
    "base-url": "http://localhost:3000",
    "kc-url": "http://localhost:8085"
}
```

```json
{
    "base-url": "http://frontenddev:3000",
    "kc-url": "http://keycloak:8085"
}
```

2. Inside the file `Containers/FrontEnd/src/components/Services/UserService.js`change:

```js
let initOptions = {
    url: 'http://localhost:8085/',
    realm: 'master',
    clientId: 'react-client',
}
```
to
```js
let initOptions = {
    url: 'http://keycloak:8085/',
    realm: 'master',
    clientId: 'react-client',
}
```

3. Inside the file `Containers/FrontEnd/src/components/Services/ApiServices.js` change all urls from `http://localhost:xxxx` to `http://servicename:xxxx` where the service name stands for the intrenal name of the cervice specified in docker-compose.yaml file. e.g. change `http://localhost:3001` to `http://confighandler:3001`

### Run test connatiner

Run the following commands:
```bash
make all-test
make test
```