const request = require('supertest');
const axios = require('axios');

const { app, server } = require('../server.js');
const { CheckIfVulnerabilities, CheckIfSBOMVulnsAll } = require('../OSSCVEscan/OSSCVEscan.js');
const { LibraryDBupdate } = require('../LibraryDBUpdate.js')

/*
      ////////////////////////////////////
     /// Mocking function and classes ///
    ////////////////////////////////////
*/

const mockConnect = jest.fn();
const mockGetAllLibraries = jest.fn();
const mockGetVulnerableAssetIDLibraries = jest.fn();
const mockGetVulnerableAllLibraries = jest.fn();

jest.mock('axios');

jest.mock('../DatabaseConn/CVEconn', () => {
    return jest.fn().mockImplementation(() => ({
        connect: mockConnect,
        getAllLibraries: mockGetAllLibraries,
        getVulnerableAssetIDLibraries: mockGetVulnerableAssetIDLibraries,
        getVulnerableAllLibraries: mockGetVulnerableAllLibraries,
    }));
});

jest.mock('../LibraryDBUpdate.js', () => ({
    LibraryDBupdate: jest.fn()
}));
jest.mock('../OSSCVEscan/OSSCVEscan.js', () => ({
    CheckIfVulnerabilities: jest.fn(),
    CheckIfSBOMVulnsAll: jest.fn(),
}));


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
    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const assetID = { assetID: "12345678910" }
        const response = await request(app)
            .post('/getVulnerableAssetID')
            .set('Authorization', 'Bearer fake_token')
            .send(assetID);
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 401 Unauthorized if the Authorization header is missing', async () => {
        const assetID = { assetID: "12345678910" }
        const response = await request(app).post('/getVulnerableAssetID').send(assetID);
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 500 Internal Server Error if there is an error fetching the library information', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const assetID = { assetID: "12345678910" }
        // Simulate a failure in the database operation
        mockGetVulnerableAssetIDLibraries.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .post('/getVulnerableAssetID')
            .set('Authorization', 'Bearer valid_token')
            .send(assetID);

        expect(response.status).toBe(500);
        expect(response.text).toContain('An error occurred while processing your request.');
    });

    test('POST /getVulnerableAssetID should return error if assetid is empty', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } });
        const assetID = { assetID: "" }
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
        mockGetVulnerableAssetIDLibraries.mockResolvedValue(libraries);

        const response = await request(app)
            .post('/getVulnerableAssetID')
            .set('Authorization', 'Bearer valid-token')
            .send(assetID);

        expect(response.status).toBe(500);
        expect(response.text).toContain('An error occurred while processing your request.');
    });

    test('POST /getVulnerableAssetID should return libraries on successful authentication and retrieval', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } });
        const assetID = { assetID: "12345678910" }
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
        mockGetVulnerableAssetIDLibraries.mockResolvedValue(libraries);

        const response = await request(app)
            .post('/getVulnerableAssetID')
            .set('Authorization', 'Bearer valid-token')
            .send(assetID);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ "cycloneDXvulns": libraries, "success": true });
        expect(mockConnect).toHaveBeenCalled();
        expect(mockGetVulnerableAssetIDLibraries).toHaveBeenCalled();
    });

    test('POST /getVulnerableAssetID should return an empty array when no libraries are available', async () => {
        mockGetVulnerableAssetIDLibraries.mockResolvedValue([]);
        const assetID = { assetID: "12345678910" }
        const response = await request(app)
            .post('/getVulnerableAssetID')
            .set('Authorization', 'Bearer valid_token')
            .send(assetID);
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ "cycloneDXvulns": [], "success": true });
    });

});

describe('GET /getVulnerableAssetAll', () => {
    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app)
            .get('/getVulnerableAssetAll')
            .set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 401 Unauthorized if the Authorization header is missing', async () => {
        const response = await request(app).get('/getVulnerableAssetAll');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 500 Internal Server Error if there is an error fetching the library information', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        // Simulate a failure in the database operation
        mockGetVulnerableAllLibraries.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .get('/getVulnerableAssetAll')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(500);
        expect(response.text).toContain('An error occurred while processing your request.');
    });

    test('GET /getVulnerableAssetAll should return libraries on successful authentication and retrieval', async () => {
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
        mockGetVulnerableAllLibraries.mockResolvedValue(libraries);

        const response = await request(app)
            .get('/getVulnerableAssetAll')
            .set('Authorization', 'Bearer valid-token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ "cycloneDXvulns": libraries, "success": true });
        expect(mockConnect).toHaveBeenCalled();
        expect(mockGetVulnerableAllLibraries).toHaveBeenCalled();
    });

    test('GET /getVulnerableAssetID should return an empty array when no libraries are available', async () => {
        mockGetVulnerableAllLibraries.mockResolvedValue([]);
        const response = await request(app)
            .get('/getVulnerableAssetAll')
            .set('Authorization', 'Bearer valid_token');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ "cycloneDXvulns": [], "success": true });
    });

});

describe('POST /libraryDBupdate', () => {

    it('should require an assetID', async () => {
        const response = await request(app)
            .post('/libraryDBupdate')
            .send({});
        expect(response.statusCode).toBe(500);
        expect(response.text).toContain('An error occurred while processing your request.');
    });

    it('should call LibraryDBupdate and CheckIfVulnerabilities on valid assetID', async () => {

        LibraryDBupdate.mockResolvedValue('Update successful');
        CheckIfVulnerabilities.mockResolvedValue();

        const response = await request(app)
            .post('/libraryDBupdate')
            .send({ assetID: '123' });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ success: true });
        expect(LibraryDBupdate).toHaveBeenCalledWith('123');
        expect(CheckIfVulnerabilities).toHaveBeenCalledWith('123');
    });

    it('should handle errors from LibraryDBupdate gracefully', async () => {
        LibraryDBupdate.mockRejectedValue(new Error('Update failed'));
        CheckIfVulnerabilities.mockResolvedValue();
        const response = await request(app)
            .post('/libraryDBupdate')
            .send({ assetID: '123' });
        expect(response.statusCode).toBe(500);
        expect(response.text).toContain('An error occurred while processing your request.');
    });

    it('should handle errors from CheckIfVulnerabilities gracefully', async () => {
        LibraryDBupdate.mockResolvedValue('Update successful');
        CheckIfVulnerabilities.mockRejectedValue(new Error('Could not check vulnerablilities'));

        const response = await request(app)
            .post('/libraryDBupdate')
            .send({ assetID: '123' });
        expect(response.statusCode).toBe(500);
        expect(response.text).toContain('An error occurred while processing your request.');
    });

});

describe('POST /removeAssetidLibs', () => {


});


describe('POST /recheckVulnerabilitiesAll', () => {


});

