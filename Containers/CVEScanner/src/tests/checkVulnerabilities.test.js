const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { CheckVulnerabilities } = require('../OSSCVEscan/OSSCVEscan.js');

describe('CheckVulnerabilities', () => {
    const apiUrl = 'https://ossindex.sonatype.org/api/v3/component-report';
    const apiAuthUrl = 'https://ossindex.sonatype.org/api/v3/authorized/component-report';
    const mock = new MockAdapter(axios);
    const purls = ['pkg:maven/org.apache.commons/commons-lang3@3.5', 'pkg:npm/express@4.17.1'];

    afterEach(() => {
        mock.reset();
    });

    it('should return data on successful API call without API key', async () => {
        const responseData = { vulnerabilities: [] };
        mock.onPost(apiUrl, { coordinates: purls }).reply(200, responseData);

        await expect(CheckVulnerabilities(purls, '')).resolves.toEqual(responseData);
    });

    it('should return data on successful API call with API key', async () => {
        const responseData = { vulnerabilities: [] };
        const apiKey = 'your_api_key';
        const encodedApiKey = Buffer.from(`${apiKey}:`).toString('base64');
        mock.onPost(apiAuthUrl, { coordinates: purls }, {
            headers: {
                authorization: `Basic ${encodedApiKey}`
            }
        }).reply(200, responseData);

        await expect(CheckVulnerabilities(purls, apiKey)).resolves.toEqual(responseData);
    });


    it('should handle empty array input correctly without API key', async () => {
        mock.onPost(apiUrl, { coordinates: [] }).reply(200, { vulnerabilities: [] });

        await expect(CheckVulnerabilities([], '')).resolves.toEqual({ vulnerabilities: [] });
    });

    it('should throw an error on API failure for a batch without API key', async () => {
        const errorMessage = 'Network Error';
        mock.onPost(apiUrl, { coordinates: purls }).networkError();

        await expect(CheckVulnerabilities(purls, '')).rejects.toThrow(errorMessage);
    });

    it('should handle non-200 status codes gracefully for a batch without API key', async () => {
        const errorResponse = { message: 'Unauthorized' };
        mock.onPost(apiUrl, { coordinates: purls }).reply(401, errorResponse);

        await expect(CheckVulnerabilities(purls, '')).rejects.toThrow('Request failed with status code 401');
    });

    it('should handle request timeout correctly without API key', async () => {
        mock.onPost(apiUrl, { coordinates: purls }).timeout();

        await expect(CheckVulnerabilities(purls, '')).rejects.toThrow('timeout of 10000ms exceeded');
    });

    it('should handle large payloads correctly without API key', async () => {
        const largePurls = new Array(100).fill('pkg:npm/react@16.13.1');
        const responseData = { vulnerabilities: [] };
        mock.onPost(apiUrl, { coordinates: largePurls }).reply(200, responseData);

        await expect(CheckVulnerabilities(largePurls, '')).resolves.toEqual(responseData);
    });
});
