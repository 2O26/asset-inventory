/*
    Tests for server.js and all its routes, namely:
        - GET /getIPranges
        - POST /addIPranges
        - POST /removeIPrange
        - GET /getRecurring
        - POST /addRecurring
        - POST /removeRecurring
        - GET /getUserConfigurations
        - POST /UpdateUserConfig
        - GET /getOSSAPIkey
        - POST /updateOSSAPIkey
*/

const request = require('supertest');
const express = require('express');
const axios = require('axios');

const { app, server, cronTask } = require('../server.js');
const { IPRangechecker, RecurringScanFormat } = require('../formatchecker.js');

/*
      ////////////////////////////////////
     /// Mocking function and classes ///
    ////////////////////////////////////
*/

const mockConnect = jest.fn();
const mockGetIPranges = jest.fn();
const mockGetRecurringScans = jest.fn();
const mockGetUserSettings = jest.fn();
const mockGetOSSAPIkey = jest.fn();
const mockAddIPrange = jest.fn();
const mockIPRangechecker = jest.fn();
const mockRemoveIPrange = jest.fn();
const mockRecurringScanFormat = jest.fn();
const mockAddRecurringScan = jest.fn();
const mockRemoveRecurringScan = jest.fn();
const mockUpdateUserSettings = jest.fn();
const mockUpdateOSSAPIkey = jest.fn();

jest.mock('axios');

jest.mock('../DatabaseConn/configdbconn', () => {
    return jest.fn().mockImplementation(() => {
        return {
            connect: mockConnect,
            getIPranges: mockGetIPranges,
            getRecurringScans: mockGetRecurringScans,
            getOSSAPIkey: mockGetOSSAPIkey,
            addIPrange: mockAddIPrange,
            removeIPrange: mockRemoveIPrange,
            addRecurringScan: mockAddRecurringScan,
            removeRecurringScan: mockRemoveRecurringScan,
            updateOSSAPIkey: mockUpdateOSSAPIkey,
        };
    });
});

jest.mock('../DatabaseConn/userConfigurationConn', () => {
    return jest.fn().mockImplementation(() => {
        return {
            connect: mockConnect,
            getUserSettings: mockGetUserSettings,
            updateUserSettings: mockUpdateUserSettings,
        };
    });
});

jest.mock('../formatchecker.js', () => ({
    IPRangechecker: jest.fn(),
    RecurringScanFormat: jest.fn(),
}));


/*
      //////////////////
     /// Test suite ///
    //////////////////
*/


afterEach(() => {
    jest.clearAllMocks(); // Resets usage data and implementations
});

describe('GET /getIPranges', () => {

    beforeAll((done) => {
        cronTask.start(); // Start cron job if it's not already started
        mockConnect.mockReset();
        mockGetIPranges.mockReset();
        done();
    });

    afterAll((done) => {
        // Stop any cron jobs if they are started in your server
        cronTask.stop();
        // Close your server here to clean up any open connections.
        server.close(() => {
            done();
        });
        jest.restoreAllMocks();
    });

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).get('/getIPranges').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with all IP ranges when the user is authenticated and admin', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } }); // Mock axios for successful authentication
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();

        // Assume successful fetch from database
        mockConnect.mockResolvedValue(true);
        configHandler.getIPranges.mockResolvedValue(['192.168.1.0/24', '172.16.0.0/12']);

        const response = await request(app)
            .get('/getIPranges')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ ipranges: ['192.168.1.0/24', '172.16.0.0/12'] });
    });

    test('responds with subset of IP ranges when the user is authenticated but not admin', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, roles: ['192.168.1.0/24'] } }); // Mock axios for successful authentication
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();

        // Assume successful fetch from database
        mockConnect.mockResolvedValue(true);
        configHandler.getIPranges.mockResolvedValue(['192.168.1.0/24', '172.16.0.0/12']);

        const response = await request(app)
            .get('/getIPranges')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ ipranges: ['192.168.1.0/24'] });
    });

    test('responds with 500 Internal Server Error if there is an error fetching the IP ranges', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();

        // Simulate a failure in the database operation
        configHandler.getIPranges.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .get('/getIPranges')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error fetching ip ranges');
    });
});

describe('POST /addIPranges', () => {
    beforeAll((done) => {
        cronTask.start(); // Start cron job if it's not already started
        mockConnect.mockReset();
        mockAddIPrange.mockReset();
        mockIPRangechecker.mockReset();
        done();
    });

    afterAll((done) => {
        // Stop any cron jobs if they are started in your server
        cronTask.stop();
        // Close your server here to clean up any open connections.
        server.close(() => {
            done();
        });
        jest.restoreAllMocks();
    });

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).post('/addIPranges').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 401 Unauthorized if the user is not an admin', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: false } });

        // Make sure to send a POST request to the correct endpoint.
        const response = await request(app)
            .post('/addIPranges')
            .set('Authorization', 'Bearer valid_token')
            .send({ iprange: '192.168.1.0/24' }); // Include the payload as it's a POST request.

        expect(response.status).toBe(401);
        expect(response.text).toBe('Unauthorized');
    });

    test('responds with return value 500 when failing to connect to database', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });
        IPRangechecker.mockReturnValue(true);

        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();
        mockConnect.mockRejectedValue(new Error('Database error'));

        const ipRange = '192.168.1.1-192.168.1.255';
        const response = await request(app)
            .post('/addIPranges')
            .set('Authorization', 'Bearer valid_admin_token')
            .send({ iprange: ipRange });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error adding ip rangess');

        expect(IPRangechecker).toHaveBeenCalledWith(ipRange);
        mockConnect.mockReset();
        IPRangechecker.mockReset();
    });

    test('responds with success message for when adding valid IP range', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });
        IPRangechecker.mockReturnValue(true);

        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();


        const ipRange = '192.168.1.1-192.168.1.255';
        const response = await request(app)
            .post('/addIPranges')
            .set('Authorization', 'Bearer valid_admin_token')
            .send({ iprange: ipRange });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            responseFromServer: "Succeeded to add IPrange!!",
            success: "success",
            range: ipRange
        });

        expect(IPRangechecker).toHaveBeenCalledWith(ipRange);
        expect(configHandler.addIPrange).toHaveBeenCalledWith(ipRange);
        mockConnect.mockReset();
        IPRangechecker.mockReset();
    });

    test('responds with failure message for invalid IP range', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });
        IPRangechecker.mockReturnValue(false);

        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();


        const ipRange = '192.168.1.255-192.168.1.1';
        const response = await request(app)
            .post('/addIPranges')
            .set('Authorization', 'Bearer valid_admin_token')
            .send({ iprange: ipRange });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            responseFromServer: "Failure to add IPrange!!",
            success: "wrong format",
            range: ipRange
        });

        expect(IPRangechecker).toHaveBeenCalledWith(ipRange);
        mockConnect.mockReset();
        IPRangechecker.mockReset();
    });
})

describe('POST /removeIPrange', () => {
    beforeAll((done) => {
        cronTask.start(); // Start cron job if it's not already started
        mockConnect.mockReset();
        mockRemoveIPrange.mockReset();
        done();
    });

    afterAll((done) => {
        // Stop any cron jobs if they are started in your server
        cronTask.stop();
        // Close your server here to clean up any open connections.
        server.close(() => {
            done();
        });
        jest.restoreAllMocks();
    });

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).post('/removeIPrange').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 401 Unauthorized if the user is not an admin', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: false } });

        // Make sure to send a POST request to the correct endpoint.
        const response = await request(app)
            .post('/removeIPrange')
            .set('Authorization', 'Bearer valid_token')
            .send({ iprange: '192.168.1.0/24' }); // Include the payload as it's a POST request.

        expect(response.status).toBe(401);
        expect(response.text).toBe('Unauthorized');
    });

    test('responds with return value 500 when failing to connect to database', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });

        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();
        mockConnect.mockRejectedValue(new Error('Database error'));

        const ipRange = '192.168.1.1-192.168.1.255';
        const response = await request(app)
            .post('/removeIPrange')
            .set('Authorization', 'Bearer valid_admin_token')
            .send({ iprange: ipRange });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error removing ip range');

        mockConnect.mockReset();
    });

    test('responds with success message for when removing existing IP range', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });
        IPRangechecker.mockReturnValue(true);

        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();


        const ipRange = '192.168.1.1-192.168.1.255';
        const response = await request(app)
            .post('/removeIPrange')
            .set('Authorization', 'Bearer valid_admin_token')
            .send({ iprange: ipRange });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            responseFromServer: "Succeeded to remove IPrange!",
            success: "success",
            range: ipRange
        });

        expect(configHandler.removeIPrange).toHaveBeenCalledWith(ipRange);
        mockConnect.mockReset();
    });
})

describe('GET /getRecurring', () => {

    beforeAll((done) => {
        cronTask.start(); // Start cron job if it's not already started
        mockConnect.mockReset();
        mockGetRecurringScans.mockReset();
        done();
    });

    afterAll((done) => {
        // Stop any cron jobs if they are started in your server
        cronTask.stop();
        // Close your server here to clean up any open connections.
        server.close(() => {
            done();
        });
        jest.restoreAllMocks();
    });

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).get('/getRecurring').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 401 Unauthorized if the user is not an admin', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: false } });
        const response = await request(app).get('/getRecurring').set('Authorization', 'Bearer valid_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Unauthorized');
    });

    test('responds with recurring scans when the user is authenticated, is admin, and data is fetched successfully', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();

        mockConnect.mockResolvedValue(true);
        configHandler.getRecurringScans.mockResolvedValue([
            { plugin: "Network Scan", time: "* * * * *", IpRange: "192.1.1.0/24" },
            { plugin: "Network Scan", time: "1 * * * *", IpRange: "10.1.1.0/23" },
            { plugin: "Network Scan", time: "1 1 2 4 1", IpRange: "192.1.1.0/32" }
        ]);

        const response = await request(app)
            .get('/getRecurring')
            .set('Authorization', 'Bearer valid_admin_token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            recurring: [
                { plugin: "Network Scan", time: "* * * * *", IpRange: "192.1.1.0/24" },
                { plugin: "Network Scan", time: "1 * * * *", IpRange: "10.1.1.0/23" },
                { plugin: "Network Scan", time: "1 1 2 4 1", IpRange: "192.1.1.0/32" }
            ]
        })
    });

    test('responds with 500 Internal Server Error if there is an error fetching the recurring scans', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();

        // Simulate a failure in the database operation
        configHandler.getRecurringScans.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .get('/getRecurring')
            .set('Authorization', 'Bearer valid_admin_token');

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error fetching recurring scans');
    });
});

describe('POST /addRecurring', () => {
    beforeAll((done) => {
        cronTask.start(); // Start cron job if it's not already started
        mockConnect.mockReset();
        mockAddRecurringScan.mockReset();
        mockRecurringScanFormat.mockReset();
        done();
    });

    afterAll((done) => {
        // Stop any cron jobs if they are started in your server
        cronTask.stop();
        // Close your server here to clean up any open connections.
        server.close(() => {
            done();
        });
        jest.restoreAllMocks();
    });

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).post('/addRecurring').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 401 Unauthorized if the user is not an admin', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: false } });
        // Make sure to send a POST request to the correct endpoint.
        const recurring = { plugin: "Network Scan", time: "* * * * *", IpRange: "192.1.1.0/24" };
        const response = await request(app)
            .post('/addRecurring')
            .set('Authorization', 'Bearer valid_token')
            .send({ recurring: recurring }); // Include the payload as it's a POST request.

        expect(response.status).toBe(401);
        expect(response.text).toBe('Unauthorized');
    });

    test('responds with return value 500 when failing to connect to database', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });
        RecurringScanFormat.mockReturnValue(true);

        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();
        mockConnect.mockRejectedValue(new Error('Database error'));

        const recurring = { plugin: "Network Scan", time: "* * * * *", IpRange: "192.1.1.0/24" };
        const response = await request(app)
            .post('/addRecurring')
            .set('Authorization', 'Bearer valid_admin_token')
            .send({ recurring: recurring });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error adding recurring scans');

        expect(RecurringScanFormat).toHaveBeenCalledWith(recurring);
        mockConnect.mockReset();
        RecurringScanFormat.mockReset();
    });

    test('responds with success message for when adding valid recurring scan settings', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });
        RecurringScanFormat.mockReturnValue(true);

        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();


        const recurring = { plugin: "Network Scan", time: "* * * * *", IpRange: "192.1.1.0/24" };
        const response = await request(app)
            .post('/addRecurring')
            .set('Authorization', 'Bearer valid_admin_token')
            .send({ recurring: recurring });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            responseFromServer: "Succeeded to add recurring scan!!",
            success: "success",
            recurring: recurring
        });

        expect(RecurringScanFormat).toHaveBeenCalledWith(recurring);
        expect(configHandler.addRecurringScan).toHaveBeenCalledWith(recurring);
        mockConnect.mockReset();
        RecurringScanFormat.mockReset();
    });

    test('responds with failure message for invalid IP range', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });
        RecurringScanFormat.mockReturnValue(false);

        const recurring = { plugin: "NetwScan", time: "* * *", IpRange: "192.1.1.0/24" };
        const response = await request(app)
            .post('/addRecurring')
            .set('Authorization', 'Bearer valid_admin_token')
            .send({ recurring: recurring });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            responseFromServer: "Failure to add recurring scan!!",
            success: "wrong format",
            recurring: recurring
        });

        expect(RecurringScanFormat).toHaveBeenCalledWith(recurring);
        mockConnect.mockReset();
        RecurringScanFormat.mockReset();
    });
})

describe('POST /removeRecurring', () => {
    beforeAll((done) => {
        cronTask.start(); // Start cron job if it's not already started
        mockConnect.mockReset();
        mockRemoveRecurringScan.mockReset();
        done();
    });

    afterAll((done) => {
        // Stop any cron jobs if they are started in your server
        cronTask.stop();
        // Close your server here to clean up any open connections.
        server.close(() => {
            done();
        });
        jest.restoreAllMocks();
    });

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).post("/removeRecurring").set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 401 Unauthorized if the user is not an admin', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: false } });

        // Make sure to send a POST request to the correct endpoint.
        const recurring = { plugin: "Network Scan", time: "* * * * *", IpRange: "192.1.1.0/24" };
        const response = await request(app)
            .post("/removeRecurring")
            .set('Authorization', 'Bearer valid_token')
            .send({ recurring: recurring }); // Include the payload as it's a POST request.

        expect(response.status).toBe(401);
        expect(response.text).toBe('Unauthorized');
    });

    test('responds with return value 500 when failing to connect to database', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });

        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();
        mockConnect.mockRejectedValue(new Error('Database error'));

        const recurring = { plugin: "Network Scan", time: "* * * * *", IpRange: "192.1.1.0/24" };
        const response = await request(app)
            .post("/removeRecurring")
            .set('Authorization', 'Bearer valid_admin_token')
            .send({ recurring: recurring });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error removing recurring scans');

        mockConnect.mockReset();
    });

    test('responds with success message for when removing existing ', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true, isAdmin: true } });
        RecurringScanFormat.mockReturnValue(true);

        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();

        const recurring = { plugin: "Network Scan", time: "* * * * *", IpRange: "192.1.1.0/24" };
        const response = await request(app)
            .post("/removeRecurring")
            .set('Authorization', 'Bearer valid_admin_token')
            .send({ recurring: recurring });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            responseFromServer: "Succeeded to remove recurring scan!",
            success: "success",
            recurring: recurring
        });

        expect(configHandler.removeRecurringScan).toHaveBeenCalledWith(recurring);
        mockConnect.mockReset();
    });
})

describe('GET /getUserConfigurations', () => {

    beforeAll((done) => {
        cronTask.start(); // Start cron job if it's not already started
        mockConnect.mockReset();
        mockGetUserSettings.mockReset();
        done();
    });

    afterAll((done) => {
        // Stop any cron jobs if they are started in your server
        cronTask.stop();
        // Close your server here to clean up any open connections.
        server.close(() => {
            done();
        });
        jest.restoreAllMocks();
    });

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).get('/getUserConfigurations').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 500 Internal Server Error if there is an error fetching the user settings', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const UserConfigHandler = require('../DatabaseConn/userConfigurationConn');
        const userConfigHandler = new UserConfigHandler();

        // Simulate a failure in the database operation
        userConfigHandler.getUserSettings.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .get('/getUserConfigurations')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error fetching user configurations');
    });

    test('responds with user settings when the user is authenticated and data is fetched successfully', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const UserConfigHandler = require('../DatabaseConn/userConfigurationConn');
        const userConfigHandler = new UserConfigHandler();

        // Assume successful fetch from database
        mockConnect.mockResolvedValue(true);
        userConfigHandler.getUserSettings.mockResolvedValue([
            {
                userID: "userID3",
                leftDash: ["Asset List"],
                rightDash: ["Graph View"],
                darkmode: false
            }
        ]);

        const response = await request(app)
            .get('/getUserConfigurations')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            userSettings: [
                {
                    userID: "userID3",
                    leftDash: ["Asset List"],
                    rightDash: ["Graph View"],
                    darkmode: false
                }
            ]
        });
    });

    test('responds with user settings when the user is authenticated and data is fetched successfully. No setting exist for requesting user.', async () => {
        const responseAxios = axios.get.mockResolvedValue({ data: { authenticated: true }, userID: 'mock-user-id' }); // Mock axios for successful authentication
        const UserConfigHandler = require('../DatabaseConn/userConfigurationConn');
        const userConfigHandler = new UserConfigHandler();

        // Assume successful fetch from database
        mockConnect.mockResolvedValue(true);
        userConfigHandler.getUserSettings.mockResolvedValue([]); // Empty array 

        const response = await request(app)
            .get('/getUserConfigurations')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            userSettings: [
                {
                    userID: responseAxios.userID,
                    leftDash: ["Graph View"],
                    rightDash: ["Asset List"],
                    darkmode: false
                },
            ]
        });
    });


});

describe('POST /UpdateUserConfig', () => {

    beforeAll((done) => {
        cronTask.start(); // Start cron job if it's not already started
        mockConnect.mockReset();
        mockUpdateUserSettings.mockReset();
        done();
    });

    afterAll((done) => {
        // Stop any cron jobs if they are started in your server
        cronTask.stop();
        // Close your server here to clean up any open connections.
        server.close(() => {
            done();
        });
        jest.restoreAllMocks();
    });

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).post('/UpdateUserConfig').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 500 Internal Server Error if there is an error updating the user settings', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const UserConfigHandler = require('../DatabaseConn/userConfigurationConn');
        const userConfigHandler = new UserConfigHandler();

        userConfigHandler.connect.mockRejectedValue(new Error('Database error'));
        const update = { leftDash: ["Graph View"], rightDash: ["Asset List"] }
        const response = await request(app)
            .post('/UpdateUserConfig')
            .set('Authorization', 'Bearer valid_token')
            .send({ update: update });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error updating user configurations');
        mockConnect.mockReset();
    });

    test('responds with user settings when the user is authenticated and settings are updated', async () => {
        const responseAxios = axios.get.mockResolvedValue({ data: { authenticated: true }, userID: 'mock-user-id' }); // Mock axios for successful authentication
        const UserConfigHandler = require('../DatabaseConn/userConfigurationConn');
        const userConfigHandler = new UserConfigHandler();


        const update = { leftDash: ["Graph View"], rightDash: ["Asset List"] }
        const response = await request(app)
            .post('/UpdateUserConfig')
            .set('Authorization', 'Bearer valid_token')
            .send({ update: update });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            responseFromServer: "Succeeded to update user setting!",
            success: true
        });

        expect(userConfigHandler.updateUserSettings).toHaveBeenCalledWith(responseAxios.userID, update);
        mockConnect.mockReset();
    });


});

describe('GET /getOSSAPIkey', () => {

    beforeAll((done) => {
        cronTask.start(); // Start cron job if it's not already started
        mockConnect.mockReset();
        mockGetOSSAPIkey.mockReset();
        done();
    });

    afterAll((done) => {
        // Stop any cron jobs if they are started in your server
        cronTask.stop();
        // Close your server here to clean up any open connections.
        server.close(() => {
            done();
        });
        jest.restoreAllMocks();
    });

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).get('/getOSSAPIkey').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 500 Internal Server Error if there is an error fetching the OSS API key', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();

        // Simulate a failure in the database operation
        configHandler.getOSSAPIkey.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .get('/getOSSAPIkey')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error fetching OSS API key');
    });

    test('responds with OSS API key when the user is authenticated and data is fetched successfully', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();

        // Assume successful fetch from database
        mockConnect.mockResolvedValue(true);
        configHandler.getOSSAPIkey.mockResolvedValue("fake-api-key");

        const response = await request(app)
            .get('/getOSSAPIkey')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ apikey: "fake-api-key" });
    });

    test('responds with OSS API key when the user is authenticated and data is fetched successfully. API key is empty.', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();

        // Assume successful fetch from database
        mockConnect.mockResolvedValue(true);
        configHandler.getOSSAPIkey.mockResolvedValue("");

        const response = await request(app)
            .get('/getOSSAPIkey')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ apikey: "" });
    });


});

describe('POST /updateOSSAPIkey', () => {

    beforeAll((done) => {
        cronTask.start(); // Start cron job if it's not already started
        mockConnect.mockReset();
        mockUpdateOSSAPIkey.mockReset();
        done();
    });

    afterAll((done) => {
        // Stop any cron jobs if they are started in your server
        cronTask.stop();
        // Close your server here to clean up any open connections.
        server.close(() => {
            done();
        });
        jest.restoreAllMocks();
    });

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).post("/updateOSSAPIkey").set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 500 Internal Server Error if there is an error updating the user settings', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const ConfigHandler = require('../DatabaseConn/configdbconn.js');
        const configHandler = new ConfigHandler();

        configHandler.connect.mockRejectedValue(new Error('Database error'));
        const old_apikey = "new-oss-api-key";
        const response = await request(app)
            .post("/updateOSSAPIkey")
            .set('Authorization', 'Bearer valid_token')
            .send({ apikey: old_apikey });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error fetching OSS API key');
        mockConnect.mockReset();
    });

    test('successfully updates the OSS API key', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } });
        const ConfigHandler = require('../DatabaseConn/configdbconn.js');
        const configHandler = new ConfigHandler();
        configHandler.connect.mockResolvedValue();
        configHandler.getOSSAPIkey.mockResolvedValue('old_key');
        configHandler.updateOSSAPIkey.mockResolvedValue();

        const newAPIKey = 'new_key123';
        const response = await request(app)
            .post('/updateOSSAPIkey')
            .set('Authorization', 'Bearer valid_token')
            .send({ apikey: newAPIKey });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ responseFromServer: "Succeeded to update OSS API key!!", success: "success" });
        expect(configHandler.updateOSSAPIkey).toHaveBeenCalledWith('old_key', newAPIKey);
    });

});

describe('cronTask: Performing regular scans', () => {

    beforeAll((done) => {
        cronTask.start(); // Start cron job if it's not already started
        mockConnect.mockReset();

        /*
            Mocks specifically made for this subsuite
        */
        jest.mock('node-cron', () => ({
            schedule: jest.fn((timing, callback) => callback()),
        }));

        jest.mock('node-fetch', () => require('fetch-mock-jest'));
        const fetchMock = require('node-fetch');

        done();
    });

    afterAll((done) => {
        // Stop any cron jobs if they are started in your server
        cronTask.stop();
        // Close your server here to clean up any open connections.
        server.close(() => {
            done();
        });
        jest.restoreAllMocks();
    });

    test('should handle database connection failure gracefully', async () => {
        // const ConfigHandler = require('../DatabaseConn/configdbconn.js');
        // const configHandler = new ConfigHandler();
        // configHandler.connect.mockResolvedValue();


        // configHandler.connect.mockRejectedValue(new Error('Connection failed'));

        // await expect(performScheduledTasks()).resolves.not.toThrow();
        // expect(response.body).toEqual({ responseFromServer: "Succeeded to update OSS API key!!", success: "success" });
        // expect(configHandler.updateOSSAPIkey).toHaveBeenCalledWith('old_key', newAPIKey);
    });
});



