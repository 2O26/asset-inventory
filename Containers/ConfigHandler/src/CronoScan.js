const ConfigHandler = require("./DatabaseConn/configdbconn");
const Plugins = require('./Plugins.js');
const { IsCronDue } = require("./IsCronDue.js");

async function ConnectToDatabaseAndFetchRecurringScans() {
    const configHandler = new ConfigHandler();
    try {
        await configHandler.connect();
        const result = await configHandler.getRecurringScans();
        return result;
    } catch (error) {
        console.error('Error connecting to database or fetching recurring scans:', error);
        throw error;
    }
}

function PrepareIpToScan(plugins, recurringScans) {
    let IpToScanWplugin = {};
    Object.keys(plugins).forEach(pluginName => {
        IpToScanWplugin[pluginName] = { cmdSelection: 'simple', IpRanges: [] }; // Use spread operator for deep copy
    });

    recurringScans.forEach(recurring => {
        // IpToScanWplugin[recurring.plugin]['IpRanges'] = []
        if (IsCronDue(recurring.time)) {

            IpToScanWplugin[recurring.plugin]['IpRanges'].push(recurring.IpRange);
        }
    });
    return IpToScanWplugin;
}

async function PerformRecurringScan(IpToScanWplugin) {
    const promises = [];
    for (const pluginType of Object.keys(IpToScanWplugin)) {
        if (Object.keys(IpToScanWplugin[pluginType]['IpRanges']).length !== 0) {
            const promise = fetch(Plugins[pluginType], {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(IpToScanWplugin[pluginType])
            }).then(response => response.json());
            promises.push(promise);
        }
    }
    const results = await Promise.all(promises);
    return results.find(result => result);
}

module.exports = { ConnectToDatabaseAndFetchRecurringScans, PrepareIpToScan, PerformRecurringScan };
