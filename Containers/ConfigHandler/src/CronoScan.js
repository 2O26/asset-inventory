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

function PrepareToScan(plugins, recurringScans) {
    let IpToScanWplugin = {};
    recurringScans.forEach(recurring => {
        // IpToScanWplugin[recurring.plugin]['IpRanges'] = []
        if (IsCronDue(recurring.time)) {
            // TODO: Differentiate if ip or non-ip scan
            if (recurring.IpRange) {
                IpToScanWplugin[recurring.plugin] = { cmdSelection: 'simple', IpRanges: [] };
                IpToScanWplugin[recurring.plugin]['IpRanges'].push(recurring.IpRange);
            } else {
                IpToScanWplugin[recurring.plugin] = ''; // Eventual payload for the get request
            }
        }
    });
    return IpToScanWplugin;
}

async function PerformRecurringScan(ToScanWplugin) {
    const promises = [];
    for (const pluginType of Object.keys(ToScanWplugin)) {
        if (ToScanWplugin[pluginType]['IpRanges']) { // Maybe remove length bit. Just check if it exists
            const promise = fetch(Plugins[pluginType], {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ToScanWplugin[pluginType])
            }).then(response => response.json());
            promises.push(promise);
        } else {
            const promise = fetch(Plugins[pluginType], {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            }).then(response => response.json());
            promises.push(promise);
        }
    }
    const results = await Promise.all(promises);
    return results.find(result => result);
}

module.exports = { ConnectToDatabaseAndFetchRecurringScans, PrepareToScan, PerformRecurringScan };
