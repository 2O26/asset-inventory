const { IsCronDue } = require('../IsCronDue');

// Mock the Date object
const mockDate = (year, month, day, hour, minute) => {
    const originalDate = Date;
    global.Date = jest.fn(() => new originalDate(year, month - 1, day, hour, minute));
    global.Date.UTC = originalDate.UTC;
    global.Date.parse = originalDate.parse;
    global.Date.now = originalDate.now;
};

describe('IsCronDue', () => {
    afterEach(() => {
        // Restore the original Date object after each test
        jest.restoreAllMocks();
    });

    it('should return true for a cron schedule matching the current time', () => {
        // Mock the current time: January 1, 2024, 00:00
        mockDate(2024, 1, 1, 0, 0);
        const cronSchedule = '0 0 1 1 *'; // At 00:00 on January 1st
        expect(IsCronDue(cronSchedule)).toBe(true);
    });

    it('should return false for a cron schedule not matching the current time', () => {
        // Mock the current time: January 1, 2024, 00:00
        mockDate(2024, 1, 1, 0, 0);
        const cronSchedule = '30 12 2 1 *'; // At 12:30 on January 2nd
        expect(IsCronDue(cronSchedule)).toBe(false);
    });

    it('should return true for a wildcard cron schedule', () => {
        // Mock the current time: January 1, 2024, 00:00
        mockDate(2024, 1, 1, 0, 0);
        const cronSchedule = '* * * * *'; // Every minute
        expect(IsCronDue(cronSchedule)).toBe(true);
    });

    it('should return false for mismatched day of week', () => {
        // Mock the current time: January 1, 2024, Monday (day 1 of the week)
        mockDate(2024, 1, 1, 0, 0);
        const cronSchedule = '* * * * 3'; // Every minute on Wednesday
        expect(IsCronDue(cronSchedule)).toBe(false);
    });

    it('should catch exceptions for invalid cron schedules', () => {
        // Mock the current time: January 1, 2024, 00:00
        mockDate(2024, 1, 1, 0, 0);
        const cronSchedule = '60 24 1 1 *'; // Invalid minute and hour
        expect(IsCronDue(cronSchedule)).toBe(false);
    });

    it('Invalid input format', () => {
        // Mock the current time: January 1, 2024, 00:00
        mockDate(2024, 1, 1, 0, 0);
        const cronSchedule = 'INVALID'; // Invalid input
        expect(IsCronDue(cronSchedule)).toBe(false);
    });

    it('Empty input format', () => {
        // Mock the current time: January 1, 2024, 00:00
        mockDate(2024, 1, 1, 0, 0);
        const cronSchedule = ''; // Invalid input
        expect(IsCronDue(cronSchedule)).toBe(false);
    });
});
