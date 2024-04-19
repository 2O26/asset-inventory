const ConfigHandler = require("./DatabaseConn/configdbconn");
const Plugins = require('./Plugins.js');

async function ConnectToDatabaseAndFetchRecurringScans() {
    const configHandler = new ConfigHandler();
    await configHandler.connect();
    const result = await configHandler.getRecurringScans();
    return result;
}

function PrepareIpToScan(plugins, scanSettings, recurringScans) {
    let IpToScanWplugin = {};

    Object.keys(plugins).forEach(pluginName => {
        IpToScanWplugin[pluginName] = { ...scanSettings }; // Use spread operator for deep copy
    });

    recurringScans.forEach(recurring => {
        if (IsCronDue(recurring.time)) {
            IpToScanWplugin[recurring.plugin]['IpRange'] = {
                ...IpToScanWplugin[recurring.plugin]['IpRange'],
                [recurring.IpRange]: true
            };
        }
    });

    return IpToScanWplugin;
}

async function PerformRecurringScan(IpToScanWplugin) {
    Object.keys(IpToScanWplugin).forEach(async pluginType => {
        if (Object.keys(IpToScanWplugin[pluginType]['IpRange']).length !== 0) {
            try {
                const response = await fetch(
                    Plugins[pluginType], {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(IpToScanWplugin[pluginType])
                });

                const resData = await response.json();
                return resData;
            } catch (err) {
                console.error(err);
                throw new Error('Network response was not ok, could not fetch state');
            }
        }
    });
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
