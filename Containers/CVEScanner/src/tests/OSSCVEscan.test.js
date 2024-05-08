// Import the functions and modules
const axios = require('axios');
const CVEscanSave = require("../DatabaseConn/CVEconn");

const {
    CheckIfVulnerabilities,
    CheckIfSBOMVulnsAll,
    getAPIkey,
    checkVulnerabilities,
    getPurlsOfAssetID,
    getAllPurls,
    processPurlsInParallel,
    reduceToVulnerabilitiesMap,
    CheckVulnerabilitiesForAll,
    filterVulnerableComponents,
    mapVulnerabilities,
    CheckVulnerabilitiesForAsset,
    checkAPIkey
} = require('../OSSCVEscan/OSSCVEscan.js');

// Mocking axios and CVEscanSave
jest.mock('axios');
jest.mock('../DatabaseConn/CVEconn');

jest.mock('../OSSCVEscan/OSSCVEscan.js', () => ({
    ...jest.requireActual('../OSSCVEscan/OSSCVEscan.js'), // This line ensures other functions are not affected
    CheckVulnerabilitiesForAsset: jest.fn().mockResolvedValue([]) // Mock implementation
}));

afterEach(() => {
    jest.restoreAllMocks();  // This will restore all mocks to their original implementations
});

describe('getAPIkey', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('returns an API key on successful fetch', async () => {
        const mockApiKey = { apikey: '12345' };
        axios.get.mockResolvedValue({ status: 200, data: mockApiKey });

        const apikey = await getAPIkey();
        expect(apikey).toBe('12345');
    });

    it('returns an empty string when the API request fails', async () => {
        axios.get.mockRejectedValue(new Error('Failed to fetch API key'));

        const apikey = await getAPIkey();
        expect(apikey).toBe("");
    });

    it('returns an empty string if the response status is not 200', async () => {
        axios.get.mockResolvedValue({ status: 404, data: {} });

        const apikey = await getAPIkey();
        expect(apikey).toBe("");
    });
});

describe('checkAPIkey', () => {
    const validApiKey = 'validKey';
    const invalidApiKey = 'invalidKey';

    it('should return true when API response status is 200', async () => {
        axios.get.mockResolvedValue({ status: 200 });
        const result = await checkAPIkey(validApiKey);
        expect(result).toBe(true);
    });

    it('should return false when API response status is not 200', async () => {
        axios.get.mockResolvedValue({ status: 404 });
        const result = await checkAPIkey(invalidApiKey);
        expect(result).toBe(false);
    });

    it('should return false when API request fails', async () => {
        axios.get.mockRejectedValue(new Error('API request failed'));
        const result = await checkAPIkey(invalidApiKey);
        expect(result).toBe(false);
    });

    it('should correctly set the Authorization header', async () => {
        axios.get.mockImplementation((url, config) => {
            if (config.headers.Authorization === `Basic ${validApiKey}`) {
                return Promise.resolve({ status: 200 });
            } else {
                return Promise.resolve({ status: 401 });
            }
        });
        const result = await checkAPIkey(validApiKey);
        expect(result).toBe(true);
    });
});



describe('getPurlsOfAssetID', () => {
    let dbConnector;
    const assetID = '1234';

    beforeEach(() => {
        dbConnector = new CVEscanSave();
        dbConnector.connect = jest.fn();
        dbConnector.getPurls = jest.fn();
    });

    it('returns PURLs for a given asset ID when database connection is successful', async () => {
        const mockPurls = ['purl1', 'purl2'];
        dbConnector.connect.mockResolvedValue();
        dbConnector.getPurls.mockResolvedValue(mockPurls);

        const purls = await getPurlsOfAssetID(assetID, dbConnector);
        expect(purls).toEqual(mockPurls);
        expect(dbConnector.connect).toHaveBeenCalled();
        expect(dbConnector.getPurls).toHaveBeenCalledWith(assetID);
    });

    it('throws an error when unable to connect to the database', async () => {
        dbConnector.connect.mockRejectedValue(new Error('Connection failed'));

        await expect(getPurlsOfAssetID(assetID, dbConnector)).rejects.toThrow('Connection failed');
        expect(dbConnector.getPurls).not.toHaveBeenCalled();
    });

    it('throws an error if the PURLs cannot be fetched after a successful connection', async () => {
        dbConnector.connect.mockResolvedValue();
        dbConnector.getPurls.mockRejectedValue(new Error('Failed to fetch PURLs'));

        await expect(getPurlsOfAssetID(assetID, dbConnector)).rejects.toThrow('Failed to fetch PURLs');
    });

    it('ensures the getPurls is called with correct asset ID', async () => {
        dbConnector.connect.mockResolvedValue();
        dbConnector.getPurls.mockResolvedValue([]);

        await getPurlsOfAssetID(assetID, dbConnector);
        expect(dbConnector.getPurls).toHaveBeenCalledWith(assetID);
    });

    it('logs an appropriate error message when an error occurs', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        const error = new Error('Generic error');
        dbConnector.connect.mockRejectedValue(error);

        try {
            await getPurlsOfAssetID(assetID, dbConnector);
        } catch (err) {
            // Error is expected
        }

        expect(consoleSpy).toHaveBeenCalledWith(`Could not get purls for asset ID ${assetID}: `, error);
    });
});

describe('getAllPurls', () => {
    let dbConnector;

    beforeEach(() => {
        dbConnector = new CVEscanSave();
        dbConnector.connect = jest.fn();
        dbConnector.getAllPurls = jest.fn();
    });

    it('returns all PURLs when database connection is successful', async () => {
        const mockPurls = ['purl1', 'purl2'];
        dbConnector.connect.mockResolvedValue();
        dbConnector.getAllPurls.mockResolvedValue(mockPurls);

        const purls = await getAllPurls(dbConnector);
        expect(purls).toEqual(mockPurls);
        expect(dbConnector.connect).toHaveBeenCalled();
        expect(dbConnector.getAllPurls).toHaveBeenCalled();
    });

    it('throws an error when unable to connect to the database', async () => {
        dbConnector.connect.mockRejectedValue(new Error('Connection failed'));

        await expect(getAllPurls(dbConnector)).rejects.toThrow('Connection failed');
        expect(dbConnector.getAllPurls).not.toHaveBeenCalled(); // Ensures no attempt to fetch PURLs if connection fails
    });

    it('throws an error if PURLs cannot be fetched after a successful connection', async () => {
        dbConnector.connect.mockResolvedValue();
        dbConnector.getAllPurls.mockRejectedValue(new Error('Failed to fetch PURLs'));

        await expect(getAllPurls(dbConnector)).rejects.toThrow('Failed to fetch PURLs');
    });

    it('ensures that the connection is always attempted', async () => {
        dbConnector.connect.mockRejectedValue(new Error('Connection attempt failed'));

        try {
            await getAllPurls(dbConnector);
        } catch (e) {
            // Error handling is just to catch the exception from the promise
        }

        expect(dbConnector.connect).toHaveBeenCalledTimes(1);
        expect(dbConnector.getAllPurls).not.toHaveBeenCalled(); // Should not call getAllPurls if connection fails
    });
});

describe('reduceToVulnerabilitiesMap', () => {
    it('should aggregate vulnerabilities by component coordinates', () => {
        const OSSresponses = [
            [
                { coordinates: 'component1', vulnerabilities: [{ id: 'CVE-123' }, { id: 'CVE-456' }] },
                { coordinates: 'component2', vulnerabilities: [] }
            ],
            [
                { coordinates: 'component3', vulnerabilities: [{ id: 'CVE-789' }] },
                { coordinates: 'component1', vulnerabilities: [{ id: 'CVE-101' }] }
            ]
        ];

        const expectedOutput = {
            'component1': [{ id: 'CVE-123' }, { id: 'CVE-456' }, { id: 'CVE-101' }],
            'component3': [{ id: 'CVE-789' }]
        };

        const result = reduceToVulnerabilitiesMap(OSSresponses);
        expect(result).toEqual(expectedOutput);
    });

    it('should return an empty object if there are no vulnerabilities', () => {
        const OSSresponses = [
            [
                { coordinates: 'component1', vulnerabilities: [] },
                { coordinates: 'component2', vulnerabilities: [] }
            ]
        ];

        const expectedOutput = {};

        const result = reduceToVulnerabilitiesMap(OSSresponses);
        expect(result).toEqual(expectedOutput);
    });

    it('should ignore components without vulnerabilities array', () => {
        const OSSresponses = [
            [
                { coordinates: 'component1' },
                { coordinates: 'component2', vulnerabilities: [{ id: 'CVE-456' }] }
            ]
        ];

        const expectedOutput = {
            'component2': [{ id: 'CVE-456' }]
        };

        const result = reduceToVulnerabilitiesMap(OSSresponses);
        expect(result).toEqual(expectedOutput);
    });
});

describe('filterVulnerableComponents', () => {
    it('should return only components with vulnerabilities', () => {
        const OSSresponses = [
            [
                { coordinates: 'component1', vulnerabilities: [{ id: 'CVE-123' }] },
                { coordinates: 'component2', vulnerabilities: [] }
            ],
            [
                { coordinates: 'component3', vulnerabilities: [{ id: 'CVE-456' }] }
            ]
        ];

        const expectedOutput = [
            { coordinates: 'component1', vulnerabilities: [{ id: 'CVE-123' }] },
            { coordinates: 'component3', vulnerabilities: [{ id: 'CVE-456' }] }
        ];

        const result = filterVulnerableComponents(OSSresponses);
        expect(result).toEqual(expectedOutput);
    });

    it('should return an empty array if no components have vulnerabilities', () => {
        const OSSresponses = [
            [
                { coordinates: 'component1', vulnerabilities: [] },
                { coordinates: 'component2', vulnerabilities: [] }
            ]
        ];

        const result = filterVulnerableComponents(OSSresponses);
        expect(result).toEqual([]);
    });
});

describe('mapVulnerabilities', () => {
    it('should map components to their vulnerabilities', () => {
        const vulnerableComponents = [
            { coordinates: 'component1', vulnerabilities: [{ id: 'CVE-123' }] },
            { coordinates: 'component2', vulnerabilities: [{ id: 'CVE-456' }] }
        ];

        const expectedOutput = {
            'component1': [{ id: 'CVE-123' }],
            'component2': [{ id: 'CVE-456' }]
        };

        const result = mapVulnerabilities(vulnerableComponents);
        expect(result).toEqual(expectedOutput);
    });

    it('should return an empty object if there are no vulnerable components', () => {
        const vulnerableComponents = [];

        const result = mapVulnerabilities(vulnerableComponents);
        expect(result).toEqual({});
    });

    it('should aggregate vulnerabilities for the same component', () => {
        const vulnerableComponents = [
            { coordinates: 'component1', vulnerabilities: [{ id: 'CVE-123' }] },
            { coordinates: 'component1', vulnerabilities: [{ id: 'CVE-999' }] }
        ];

        const expectedOutput = {
            'component1': [{ id: 'CVE-123' }, { id: 'CVE-999' }]
        };

        const result = mapVulnerabilities(vulnerableComponents);
        expect(result).toEqual(expectedOutput);
    });
});
