const fs = require('fs');


function CronoScanAdd(recurring) {
    // mount dir /app
    const dir = "/app";
    let filename = ""
    filename += recurring.plugin;
    filename += recurring.time;
    filename += recurring.IpRange;
    filename += ".sh"; // bash file
    console.log(filename);


    const scanSettings = {
        commandSelection: 'simple',
        IPRanges: {
            // Modifiable IP address and its status
            [recurring.IpRange]: true
        }
    };
    const scanSettingsJson = JSON.stringify(scanSettings);

    const curlCommand = `curl -X POST http://networkscan:8081/startNetScan \\
       -H "Content-Type: application/json" \\
       -d '${scanSettingsJson.replace(/'/g, "'\\''")}'`;


    console.log(curlCommand);
    try {
        fs.writeFileSync(filename, curlCommand);
        console.log('File has been written successfully.');
    } catch (err) {
        console.error('Error writing file:', err);
    }

    try {
        // 0o755 sets read/write/execute permissions for the owner, and read/execute permissions for group and others
        fs.chmodSync(filename, 0o755);
        console.log('Execute permission has been set successfully.');
    } catch (err) {
        console.error('Error setting execute permission:', err);
    }


    // TODO: Modify crontab file to get the cronjob

}

function CronoScanRm(recurring) {
    const dir = "/app";
    // Remove bash script that sends curl request to assethandler for this particalular 
    // Modify crontab file, i.e, remove line in questopm
}

function CronoScanEdit(recurring) {
    const dir = "/app";
    // Remove bash script to send curl request to assethandler
    // Modify crontab file, i.e, 
}

module.exports = { CronoScanAdd, CronoScanRm, CronoScanEdit };
