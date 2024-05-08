const rewire = require('rewire');
const myModule = rewire('../OSSCVEscan/OSSCVEscan.js');

const mockCheckVulnerabilities = jest.fn();
myModule.__set__('CheckVulnerabilities', mockCheckVulnerabilities);

const { processPurlsSequentially } = myModule;

describe('processPurlsSequentially', () => {
    const apiKey = 'test-api-key';
    const purls = [
        'pkg:npm/react@16.13.1',
        'pkg:npm/express@4.17.1',
        'pkg:maven/org.apache.commons/commons-lang3@3.5'
    ];

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should process multiple batches successfully', async () => {
        mockCheckVulnerabilities.mockResolvedValue({ success: true });
        const batchSize = 1; // Every PURL becomes its own batch
        const expected = [{ success: true }, { success: true }, { success: true }];

        const results = await processPurlsSequentially(purls, apiKey, batchSize);

        expect(results).toEqual(expected);
        expect(mockCheckVulnerabilities).toHaveBeenCalledTimes(purls.length);
    });

    it('should handle errors and stop processing on first failure', async () => {
        mockCheckVulnerabilities.mockResolvedValueOnce({ success: true })
            .mockRejectedValueOnce(new Error('Network error'));

        const batchSize = 1;
        await expect(processPurlsSequentially(purls, apiKey, batchSize))
            .rejects.toThrow('Network error');

        expect(mockCheckVulnerabilities).toHaveBeenCalledTimes(2);
    });

    it('should return an empty array when no PURLs are provided', async () => {
        const results = await processPurlsSequentially([], apiKey, 2);
        expect(results).toEqual([]);
    });

    it('should handle a single PURL when it matches batch size', async () => {
        mockCheckVulnerabilities.mockResolvedValue({ success: true });
        const singlePurl = [purls[0]];
        const results = await processPurlsSequentially(singlePurl, apiKey, 1);

        expect(results).toEqual([{ success: true }]);
        expect(mockCheckVulnerabilities).toHaveBeenCalledWith(singlePurl, apiKey);
    });

    it('should handle non-divisible batch size correctly', async () => {
        mockCheckVulnerabilities.mockResolvedValue({ success: true });
        const batchSize = 2; // This will create two batches, one with 2 PURLs and one with 1
        const expected = [{ success: true }, { success: true }];

        const results = await processPurlsSequentially(purls, apiKey, batchSize);

        expect(results).toEqual(expected);
        expect(mockCheckVulnerabilities).toHaveBeenCalledTimes(2);
    });

    it('should handle all batches failing', async () => {
        mockCheckVulnerabilities.mockRejectedValue(new Error('Batch failure'));
        const batchSize = 1;

        await expect(processPurlsSequentially(purls, apiKey, batchSize))
            .rejects.toThrow('Batch failure');

        expect(mockCheckVulnerabilities).toHaveBeenCalledTimes(1); // Fails on the first batch
    });
});
