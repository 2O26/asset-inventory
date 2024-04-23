const { IPRangechecker, RecurringScanFormat, validPlugin, cronFormat, isValidIpRange, isValidSubnet, isValidIp, convertIpToNumber } = require('../formatchecker.js'); // Replace 'yourModule' with the path to your module file.
const Plugins = require('../Plugins.js');

describe('IP Utilities', () => {
    describe('convertIpToNumber', () => {
        it('should convert an IP address to the correct number', () => {
            expect(convertIpToNumber('127.0.0.1')).toBe(2130706433);
            expect(convertIpToNumber('192.168.1.1')).toBe(3232235777);
        });

        it('should handle edge cases for IP conversion', () => {
            expect(convertIpToNumber('0.0.0.0')).toBe(0);
            expect(convertIpToNumber('255.255.255.255')).toBe(4294967295);
        });
    });

    describe('isValidIp', () => {
        it('should return true for a valid IP address', () => {
            expect(isValidIp('192.168.1.1')).toBe(true);
            expect(isValidIp('10.0.0.1')).toBe(true);
        });

        it('should return false for an invalid IP address', () => {
            expect(isValidIp('256.256.256.256')).toBe(false);
            expect(isValidIp('192.168.1')).toBe(false);
        });
    });

    describe('isValidSubnet', () => {
        it('should return true for a valid subnet', () => {
            expect(isValidSubnet('192.168.1.0/24')).toBe(true);
            expect(isValidSubnet('10.0.0.0/8')).toBe(true);
        });

        it('should return false for an invalid subnet', () => {
            expect(isValidSubnet('192.168.1.0/33')).toBe(false);
            expect(isValidSubnet('10.0.0.0')).toBe(false);
        });
    });

    describe('isValidIpRange', () => {
        it('should return true for a valid IP range', () => {
            expect(isValidIpRange('192.168.1.1-100')).toBe(true);
            expect(isValidIpRange('10.0.0.0-255')).toBe(true);
        });

        it('should return false for an invalid IP range', () => {
            expect(isValidIpRange('192.168.1.1-256')).toBe(false);
            expect(isValidIpRange('10.0-0.0-255')).toBe(false);
            expect(isValidIpRange('10.0.0.0-0')).toBe(false); // Range is not in ascending order
        });
    });

    describe('validPlugin', () => {
        it('should return true for a plugin that exists', () => {
            expect(validPlugin('Network Scan')).toBe(true);
        });

        it('should return false for a plugin that does not exist', () => {
            expect(validPlugin('nonExistentPlugin')).toBe(false);
        });
    });

    describe('IPRangechecker', () => {
        it('should return true for a valid subnet', () => {
            expect(IPRangechecker('192.168.1.0/24')).toBe(true);
        });

        it('should return false for an invalid subnet', () => {
            expect(IPRangechecker('192.168.1.0/33')).toBe(false); // Invalid subnet mask
        });
    });

    describe('RecurringScanFormat', () => {
        it('should return true for a valid recurring scan format', () => {
            const recurring = {
                IpRange: '192.168.1.0/24',
                time: '* * * * *', // This is a valid cron format
                plugin: 'Network Scan',
            };
            expect(RecurringScanFormat(recurring)).toBe(true);
        });

        it('should return false for an invalid IP range', () => {
            const recurring = {
                IpRange: '192.168.1.0/33', // Invalid subnet mask
                time: '* * * * *',
                plugin: 'Network Scan',
            };
            expect(RecurringScanFormat(recurring)).toBe(false);
        });

        it('should return false for an invalid cron format', () => {
            const recurring = {
                IpRange: '192.168.1.0/24',
                time: 'invalid cron', // Invalid cron string
                plugin: 'Network Scan',
            };
            expect(RecurringScanFormat(recurring)).toBe(false);
        });

        it('should return false for an invalid plugin name', () => {
            const recurring = {
                IpRange: '192.168.1.0/24',
                time: '* * * * *',
                plugin: 'nonExistentPlugin', // Non-existent plugin
            };
            expect(RecurringScanFormat(recurring)).toBe(false);
        });
    });
});

