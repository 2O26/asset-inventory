import Keycloak from "keycloak-js";

let initOptions = {
    url: 'http://localhost:8085/',
    realm: 'master',
    clientId: 'react-client',
}

const _kc = new Keycloak(initOptions);

/**
 * Initializes Keycloak instance and calls the provided callback function if successfully authenticated.
 *
 * @param onAuthenticatedCallback
 */
const initKeycloak = (onAuthenticatedCallback) => {
    _kc.init({
        onLoad: 'login-required', // Supported values: 'check-sso' , 'login-required'
        checkLoginIframe: true,
        pkceMethod: 'S256',
    })
        .then((authenticated) => {
            if (!authenticated) {
                console.log("user is not authenticated..!");
            }
            onAuthenticatedCallback();
        })
        .catch(console.error);
};

const doLogin = _kc.login;

const doLogout = _kc.logout;

const getToken = () => _kc.token;

const getTokenParsed = () => _kc.tokenParsed;

const isLoggedIn = () => !!_kc.token;

const updateToken = (successCallback) =>
    _kc.updateToken(5)
        .then(successCallback)
        .catch(doLogin);

const getUsername = () => _kc.tokenParsed?.preferred_username;
const getFirstname = () => _kc.tokenParsed?.given_name;
const getLastname = () => _kc.tokenParsed?.family_name;
const getEmail = () => _kc.tokenParsed?.email;
const getRoles = () => _kc.tokenParsed?.realm_access.roles;

const hasRole = (roles) => roles.some((role) => _kc.hasRealmRole(role));

const UserService = {
    initKeycloak,
    doLogin,
    doLogout,
    isLoggedIn,
    getToken,
    getTokenParsed,
    updateToken,
    getUsername,
    getFirstname,
    getLastname,
    getEmail,
    hasRole,
    getRoles
};

export default UserService;