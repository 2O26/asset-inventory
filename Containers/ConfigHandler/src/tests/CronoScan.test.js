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

global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ success: true })
    })
);

const { ConnectToDatabaseAndFetchRecurringScans, PrepareIpToScan, PerformRecurringScan } = require('../CronoScan.js');

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


// describe('PrepareIpToScan', () => {
//     it('prepares IPs and plugins correctly', () => {
//         const plugins = { examplePlugin: {} };
//         const scanSettings = {};
//         const recurringScans = [{ plugin: 'Network Scan', IpRange: "192.168.0.1/24", time: "* * * * *" }];

//         const result = PrepareIpToScan(plugins, scanSettings, recurringScans);
//         // expect(result).toHaveProperty('examplePlugin.IpRange.192.168.0.1/24');
//     });
// });

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
