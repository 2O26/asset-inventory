const request = require('supertest');
const { app, server, getKey } = require('../server.js');
const jwt = require('jsonwebtoken');
const { jwksClient } = require('jwks-rsa');

/*
      /////////////////////////////////
     /////// Mocked functions ////////
    /////////////////////////////////
*/


const mockGetKey = jest.fn().mockImplementation((header, callback) => {
    callback(null, 'mockedPublicKey'); // Mock public key or whatever getKey is supposed to return
});


jest.mock('jwks-rsa', () => {
    // Mock the function that jwksClient returns when called with new
    const mockGetSigningKey = jest.fn((kid, callback) => {
        if (kid === 'mockedKidWithError') {
            const error = new Error('Error retrieving signing key');
            callback(error, null); // Simulate an error occurring
        } else {
            const err = null;
            const key = { publicKey: 'mockedPublicKey' };
            callback(err, key);
        }
    });

    // Return a function that, when called with new, returns an object with a getSigningKey function
    return jest.fn(() => ({
        getSigningKey: mockGetSigningKey
    }));
});

jest.mock('jsonwebtoken', () => ({
    ...jest.requireActual('jsonwebtoken'),
    verify: jest.fn((token, getKey, options, callback) => {
        if (token === 'valid_token_with_roles') {
            callback(null, {
                sub: '12345',
                preferred_username: 'testuser',
                realm_access: {
                    roles: ['role1', '192.168.1.0/24', 'admin', 'manage-assets']
                }
            });
        } else if (token === 'valid_token_no_roles') {
            callback(null, {
                sub: '12345',
                preferred_username: 'testuser',
                realm_access: { roles: [] } // No roles
            });
        } else if (token === 'valid_token') { // The token used in the '/getUID' test
            callback(null, {
                sub: '12345', // Ensure the sub claim is the same as the userID expected in the test
                preferred_username: 'testuser',
                // Include other claims as necessary for your tests
            });
        }
        else {
            callback(new Error('Invalid token'), null);
        }
    }),
}));

const client = {
    getSigningKey: jest.fn()
};

afterAll((done) => {
    if (server && server.listening) {
        server.close(() => {
            done(); // Call `done` here to ensure it's called after server is closed and cronTask is stopped
        });
    } else {
        done();
    }
});

afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks(); // Resets usage data and implementations
    jwt.verify.mockImplementation((token, getKey, options, callback) => {
        if (token === 'valid_token_with_roles') {
            callback(null, {
                sub: '12345',
                preferred_username: 'testuser',
                realm_access: {
                    roles: ['role1', '192.168.1.0/24', 'admin', 'manage-assets']
                }
            });
        } else if (token === 'valid_token_no_roles') {
            callback(null, {
                sub: '12345',
                preferred_username: 'testuser',
                realm_access: { roles: [] } // No roles
            });
        } else if (token === 'valid_token') { // The token used in the '/getUID' test
            callback(null, {
                sub: '12345', // Ensure the sub claim is the same as the userID expected in the test
                preferred_username: 'testuser',
                // Include other claims as necessary for your tests
            });
        }
        else {
            callback(new Error('Invalid token'), null);
        }
    }
    );

});

describe('/status route', () => {
    test('should return status message', async () => {
        const response = await request(app).get('/status');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe("Check Status");
    });

    test('should have correct headers', async () => {
        const response = await request(app).get('/status');
        expect(response.headers['content-type']).toMatch(/text\/plain/);
    });
});

describe('/getUID route', () => {
    it('should authenticate with valid token', async () => {
        const response = await request(app)
            .get('/getUID')
            .set('Authorization', 'Bearer valid_token'); // Use the mocked valid token

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            authenticated: true,
            userID: '12345', // The userID returned should match the mock
        });
    });

    it('should reject invalid token', async () => {
        const response = await request(app)
            .get('/getUID')
            .set('Authorization', 'Bearer invalid_token'); // Use an invalid token

        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            authenticated: false,
            message: 'Invalid token',
        });
    });

    it('should handle request with no token', async () => {
        const response = await request(app)
            .get('/getUID');

        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            authenticated: false,
            message: 'Received no authentication token',
        });
    });

    it('should reject expired token', async () => {
        // Mock JWT verify to simulate an expired token
        jwt.verify.mockImplementation((token, getKey, options, callback) => {
            if (token === 'expired_token') {
                const error = new jwt.TokenExpiredError('Invalid token', new Date());
                callback(error, null);
            }
        });

        const response = await request(app)
            .get('/getUID')
            .set('Authorization', 'Bearer expired_token');
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            authenticated: false,
            message: 'Invalid token',
        });
    });
    it('should reject token signed with incorrect key', async () => {
        const response = await request(app)
            .get('/getUID')
            .set('Authorization', 'Bearer token_with_wrong_key');

        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            authenticated: false,
            message: 'Invalid token',
        });
    });

    it('should reject token without sub claim', async () => {
        jwt.verify.mockImplementation((token, getKey, options, callback) => {
            if (token === 'token_without_sub') {
                callback(null, {}); // no sub claim
            }
        });

        const response = await request(app)
            .get('/getUID')
            .set('Authorization', 'Bearer token_without_sub');

        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            authenticated: false,
            message: 'Invalid token', // or a more specific message for tokens without `sub`
        });
    });

    it('should reject token not valid yet due to nbf claim', async () => {
        jwt.verify.mockImplementation((token, getKey, options, callback) => {
            if (token === 'future_nbf_token') {
                const error = new jwt.NotBeforeError('jwt not active', new Date());
                callback(error, null);
            }
        });

        const response = await request(app)
            .get('/getUID')
            .set('Authorization', 'Bearer future_nbf_token');

        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            authenticated: false,
            message: 'Invalid token', // or a more specific message for nbf error
        });
    });

    it('should handle malformed Authorization header', async () => {
        const response = await request(app)
            .get('/getUID')
            .set('Authorization', 'InvalidAuthFormat');

        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            authenticated: false,
            message: 'Invalid token',
        });
    });

});


describe('/getRoles route', () => {
    test('should return roles and permissions with valid token', async () => {
        const response = await request(app)
            .get('/getRoles')
            .set('Authorization', 'Bearer valid_token_with_roles'); // Mock this token to include roles and permissions
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            authenticated: true,
            roles: expect.arrayContaining([expect.any(String)]),
            isAdmin: expect.any(Boolean),
            canManageAssets: expect.any(Boolean)
        });
    });

    test('should handle token without roles', async () => {
        const response = await request(app)
            .get('/getRoles')
            .set('Authorization', 'Bearer valid_token_no_roles'); // Mock this token to not include roles
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            authenticated: true,
            roles: [],
            isAdmin: false,
            canManageAssets: false
        });
    });

    test('should reject request with invalid token', async () => {
        const response = await request(app)
            .get('/getRoles')
            .set('Authorization', 'Bearer invalid_token');
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            authenticated: false,
            message: 'Invalid token'
        });
    });

    test('should reject token without realm_access', async () => {
        jwt.verify.mockImplementation((token, getKey, options, callback) => {
            if (token === 'token_without_realm_access') {
                callback(null, {
                    sub: 'user123'
                    // Missing realm_access entirely
                });
            }
        });

        const response = await request(app)
            .get('/getRoles')
            .set('Authorization', 'Bearer token_without_realm_access');
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            authenticated: false,
            message: 'Invalid token'  // or a more specific message
        });
    });

    test('should handle roles without numbers', async () => {
        jwt.verify.mockImplementation((token, getKey, options, callback) => {
            if (token === 'token_with_non_numeric_roles') {
                callback(null, {
                    sub: 'user123',
                    realm_access: {
                        roles: ['user', 'editor', 'viewer']  // Roles without numbers
                    }
                });
            }
        });

        const response = await request(app)
            .get('/getRoles')
            .set('Authorization', 'Bearer token_with_non_numeric_roles');
        expect(response.statusCode).toBe(200);
        expect(response.body.roles).toEqual([]);  // Expecting no roles because none contain numbers and not admin nor manage-assets
    });

    test('should reject correct roles but no sub', async () => {
        jwt.verify.mockImplementation((token, getKey, options, callback) => {
            if (token === 'token_without_sub') {
                callback(null, {
                    // Missing sub claim entirely
                    realm_access: {
                        roles: ['admin', 'manage-assets']
                    }
                });
            }
        });

        const response = await request(app)
            .get('/getRoles')
            .set('Authorization', 'Bearer token_without_sub');
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual({
            authenticated: false,
            message: 'Invalid token',
        });
    });
});

describe('getKey function', () => {
    it('should correctly return a signing key', done => {
        // Mock the client.getSigningKey to simulate a successful retrieval of the key
        client.getSigningKey.mockImplementation((kid, callback) => {
            const key = { publicKey: 'mockedPublicKey', rsaPublicKey: 'mockedRsaPublicKey' };
            callback(null, key);
        });

        function callback(error, signingKey) {
            try {
                expect(error).toBeNull();
                expect(signingKey).toBe('mockedPublicKey'); // or 'mockedRsaPublicKey' depending on what you expect
                done();
            } catch (error) {
                done(error);
            }
        }

        getKey({ kid: 'mockedKid' }, callback);
    });

    it('should handle errors from getSigningKey appropriately', done => {
        mockGetKey.mockImplementation((header, callback) => {
            const error = new Error('Error retrieving signing key');
            callback(error, null);
        });

        // Call getKey with a mock header and the callback
        getKey({ kid: 'mockedKidWithError' }, (error, signingKey) => {
            try {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe('Error retrieving signing key');
                expect(signingKey).toBeUndefined(); // This assertion expects that signingKey is not defined at all
                done();
            } catch (error) {
                done(error); // Pass the error from expect to done to signal the test failure
            }
        });


    });
});