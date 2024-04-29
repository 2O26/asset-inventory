const request = require('supertest');
const axios = require('axios');

const { app, server } = require('../server.js');

/*
      ////////////////////////////////////
     /// Mocking function and classes ///
    ////////////////////////////////////
*/

jest.mock('axios');

const mockConnect = jest.fn();
const mockGetAllLibraries = jest.fn();
const mockGetVulnerableAssetIDLibraries = jest.fn();
const mockGetVulnerableAllLibraries = jest.fn();

jest.mock('../DatabaseConn/CVEconn', () => {
    return jest.fn().mockImplementation(() => {
        return {
            connect: mockConnect,
            getAllLibraries: mockGetAllLibraries,
            getVulnerableAssetIDLibraries: mockGetVulnerableAssetIDLibraries,
            getVulnerableAllLibraries: mockGetVulnerableAllLibraries,
        };
    });
});

/*
      //////////////////////////
     /////// Test suite ///////
    //////////////////////////
*/

afterAll((done) => {
    if (server && server.listening) {
        server.close(() => {
            done(); // Call `done` here to ensure it's called after server is closed and cronTask is stopped
        });
    } else {
        done();
    }
});

describe('/status route', () => {
    test('should return status message', async () => {
        const response = await request(app).get('/status');
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe("Check Status");
    });

    test('should have correct headers', async () => {
        const response = await request(app).get('/status');
        expect(response.headers['content-type']).toMatch(/text\/html/);
    });
});

describe('GET /getAllLibraries', () => {
    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).get('/getAllLibraries').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 401 Unauthorized if the Authorization header is missing', async () => {
        const response = await request(app).get('/getAllLibraries');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 500 Internal Server Error if there is an error fetching the library information', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const CVEscanSave = require('../DatabaseConn/CVEconn');
        const cvescanSave = new CVEscanSave();

        // Simulate a failure in the database operation
        mockGetAllLibraries.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .get('/getAllLibraries')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(500);
        expect(response.text).toContain('An error occurred while processing your request.');
    });

    test('GET /getAllLibraries should return libraries on successful authentication and retrieval', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } });

        const libraries = [
            {
                CVE: { externalReference: [] },
                purl: 'pkg:npm/body-parser@1.19.0',
                assetids: ['45665607189790728'],
                name: 'body-parser',
                version: '1.19.0',
            },
            {
                CVE: { externalReference: [] },
                purl: 'pkg:npm/bytes@3.1.0',
                assetids: ['45665607189790728'],
                name: 'bytes',
                version: '3.1.0',
            },
            {
                CVE: { externalReference: [] },
                purl: 'pkg:npm/content-type@1.0.4',
                assetids: ['45665607189790728'],
                name: 'content-type',
                version: '1.0.4',
            },
            {
                CVE: { externalReference: [] },
                purl: 'pkg:npm/debug@2.6.9',
                assetids: ['45665607189790728'],
                name: 'debug',
                version: '2.6.9',
            }]
        mockGetAllLibraries.mockResolvedValue(libraries);

        const response = await request(app)
            .get('/getAllLibraries')
            .set('Authorization', 'Bearer valid-token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ "libraries": libraries, "success": true });
        expect(mockConnect).toHaveBeenCalled();
        expect(mockGetAllLibraries).toHaveBeenCalled();
    });

    test('GET /getAllLibraries should return an empty array when no libraries are available', async () => {
        mockGetAllLibraries.mockResolvedValue([]);
        const response = await request(app)
            .get('/getAllLibraries')
            .set('Authorization', 'Bearer valid_token');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ "libraries": [], "success": true });
    });



});

describe('POST /getVulnerableAssetID', () => {


});

describe('POST /getVulnerableAssetAll', () => {


});

describe('POST /libraryDBupdate', () => {


});

describe('POST /removeAssetidLibs', () => {


});


describe('POST /recheckVulnerabilitiesAll', () => {


});

