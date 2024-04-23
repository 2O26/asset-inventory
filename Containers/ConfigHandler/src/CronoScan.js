const ConfigHandler = require("./DatabaseConn/configdbconn");
const Plugins = require('./Plugins.js');

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

function PrepareIpToScan(plugins, scanSettings, recurringScans) {
    let IpToScanWplugin = {};

    Object.keys(plugins).forEach(pluginName => {
        IpToScanWplugin[pluginName] = { ...scanSettings }; // Use spread operator for deep copy
    });

    recurringScans.forEach(recurring => {
        if (IsCronDue(recurring.time)) {
            IpToScanWplugin[recurring.plugin]['IpRanges'] = []
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

function IsCronDue(cronSchedule) {
    try {
        const now = new Date();
        const [minute, hour, dayOfMonth, month, dayOfWeek] = cronSchedule.split(' ').map(s => s.trim());

        // Cron months start from 1 (January) to 12 (December), JavaScript months from 0 to 11
        const matchesMonth = month === '*' || parseInt(month) === now.getMonth() + 1;
        const matchesDayOfMonth = dayOfMonth === '*' || parseInt(dayOfMonth) === now.getDate();
        // Day of week in both cron and JavaScript is 0 (Sunday) to 6 (Saturday)
        const matchesDayOfWeek = dayOfWeek === '*' || parseInt(dayOfWeek) === now.getDay();
        const matchesHour = hour === '*' || parseInt(hour) === now.getHours();
        const matchesMinute = minute === '*' || parseInt(minute) === now.getMinutes();

        return matchesMonth && matchesDayOfMonth && matchesDayOfWeek && matchesHour && matchesMinute;
    } catch (err) {
        console.error('Error parsing cron expression:', err.message);
        return false;
    }
}



module.exports = { ConnectToDatabaseAndFetchRecurringScans, PrepareIpToScan, PerformRecurringScan };
