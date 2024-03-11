
function convertIpToNumber(ip) {
    return ip.split('.').reduce((acc, octet) => acc * 256 + parseInt(octet, 10), 0);
}

function isValidIp(ip) {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

function isValidSubnet(ip) {
    const ipWithSubnetRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-9]|[1-2][0-9]|3[0-2])$/;
    return ipWithSubnetRegex.test(ip);
}

function isValidIpRange(ipRange) {
    const parts = ipRange.split('-');
    if (parts.length !== 2 || !isValidIp(parts[0]) || !isValidIp(parts[1])) {
        return false;
    }

    const startIpNum = convertIpToNumber(parts[0]);
    const endIpNum = convertIpToNumber(parts[1]);

    return startIpNum <= endIpNum;
}

function IPRangechecker(IPRange) {

    if (isValidIp(IPRange) || isValidSubnet(IPRange) || isValidIpRange(IPRange)) {
        return true;
    }
    // return ipRegex.test(IPRange);
    return false;
}

module.exports = { IPRangechecker };
