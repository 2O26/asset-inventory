
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
    // Split the input into the IP part and the range part
    const [ipPart, rangeEnd] = ipRange.split('-');
    if (!ipPart || !rangeEnd) {
        return false; // Ensure both parts exist
    }

    if (!isValidIp(ipPart)) {
        return false;
    }

    const octets = ipPart.split('.');
    if (octets.length !== 4) {
        return false; // Ensure there are exactly 4 octets
    }

    const lastOctetNum = parseInt(octets[3], 10);
    const rangeEndNum = parseInt(rangeEnd, 10);

    if (isNaN(lastOctetNum) || isNaN(rangeEndNum) || lastOctetNum < 0 || lastOctetNum > 255 || rangeEndNum < 0 || rangeEndNum > 255) {
        return false;
    }

    // Ensure the range is in ascending order
    return lastOctetNum < rangeEndNum;
}

function IPRangechecker(IPRange) {

    if (isValidIp(IPRange) || isValidSubnet(IPRange) || isValidIpRange(IPRange)) {
        return true;
    }
    // return ipRegex.test(IPRange);
    return false;
}

module.exports = { IPRangechecker };
