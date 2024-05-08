const Plugins = require('../Plugins.js');
const ConfigHandler = require("../DatabaseConn/configdbconn");

jest.mock("../DatabaseConn/configdbconn", () => {
    return jest.fn().mockImplementation(() => {
        return {
            connect: jest.fn(),
            getRecurringScans: jest.fn(),
        };
    });
});

const mockIsCronDue = jest.fn();

jest.mock('../IsCronDue', () => ({
    IsCronDue: mockIsCronDue
}));
const { IsCronDue } = require('../IsCronDue');

global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ success: true })
    })
);

const { ConnectToDatabaseAndFetchRecurringScans, PrepareToScan, PerformRecurringScan } = require('../CronoScan.js');

describe('ConnectToDatabaseAndFetchRecurringScans', () => {
    it('handles connection errors', async () => {
        const mockConnect = jest.fn().mockRejectedValue(new Error('Connection Failed'));
        const mockGetRecurringScans = jest.fn();

        ConfigHandler.mockImplementation(() => {
            return {
                connect: mockConnect,
                getRecurringScans: mockGetRecurringScans
            };
        });

        // Act and Assert: Attempt to connect and catch the expected error
        await expect(ConnectToDatabaseAndFetchRecurringScans()).rejects.toThrow('Connection Failed');
    });

    it('connects to the database and fetches recurring scans', async () => {
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();
        configHandler.connect.mockResolvedValue();

        configHandler.getRecurringScans.mockResolvedValue([{ plugin: "examplePlugin", IpRange: "192.168.0.1/24", time: "5 * * * *" }])
        const scans = await ConnectToDatabaseAndFetchRecurringScans();
        expect(scans).toEqual([{ plugin: "examplePlugin", IpRange: "192.168.0.1/24", time: "5 * * * *" }]);
    });

});


describe('PrepareToScan', () => {
    beforeEach(() => {
        mockIsCronDue.mockReset();
    })

    // Test to ensure it creates an IpToScanWplugin object with plugins but no IP ranges
    it('should create an IpToScanWplugin object with plugin configurations and no IP ranges if NO cron is due', () => {
        IsCronDue.mockReturnValue(false);
        const recurringScans = [
            {
                plugin: 'Network Scan',
                time: '* * * * 4',
                IpRange: '127.0.0.1/32',
            },
            {
                plugin: 'Network Scan',
                time: '* * * * 1',
                IpRange: '192.168.1.0/24',
            }
        ]
        const expectedOutput = {}
        const result = PrepareToScan(Plugins, recurringScans);
        expect(result).toEqual(expectedOutput);
    });

    // Test to ensure it includes the IP range for a plugin if the cron is due
    it('Should include the IP range for the plugin if the cron jobs are due', () => {
        IsCronDue.mockReturnValue(true);
        const recurringScans = [
            {
                plugin: 'Network Scan',
                time: '* * * * *',
                IpRange: '127.0.0.1/32',
            },
            {
                plugin: 'CVE Scan',
                time: '* * * * 1',
            }
        ]
        const expectedOutput = {
            'Network Scan': { cmdSelection: 'simple', IpRanges: ['127.0.0.1/32'] },
            'CVE Scan': ''
        }
        const result = PrepareToScan(Plugins, recurringScans);
        expect(result).toEqual(expectedOutput);
    });

    it('Should return empty list of IpRanges if recurring scans field is empty', () => {
        IsCronDue.mockReturnValue(true);

        const recurringScans = [{
            plugin: 'CVE Scan',
            time: '* * * * 1',
        }]
        const expectedOutput = {
            'CVE Scan': ''
        }
        const result = PrepareToScan(Plugins, recurringScans);
        expect(result).toEqual(expectedOutput);
    });
});

describe('PerformRecurringScan', () => {
    beforeEach(() => {
        // Clear all instances and calls to constructor and all methods:
        fetch.mockClear();
    });

    it('performs recurring scans', async () => {
        const IpToScanWplugin = {
            'Network Scan': { cmdSelection: 'simple', IpRanges: ['127.0.0.1/32'] }
        }

        const result = await PerformRecurringScan(IpToScanWplugin);
        for (const pluginType of Object.keys(IpToScanWplugin)) {
            expect(fetch).toHaveBeenCalledWith(Plugins[pluginType], {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(IpToScanWplugin[pluginType])
            });
            expect(result).toEqual({ success: true });
        }

    });
});
