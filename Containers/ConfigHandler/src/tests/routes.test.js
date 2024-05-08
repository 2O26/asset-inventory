const request = require('supertest');
const axios = require('axios');
const { app, server, CronTask } = require('../server.js');
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
const mockGetTrelloKeys = jest.fn()
const mockUpdateTrelloKeys = jest.fn();
const mockGetDocLink = jest.fn();
const mockSetDocLink = jest.fn();

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
            getTrelloKeys: mockGetTrelloKeys,
            updateTrelloKeys: mockUpdateTrelloKeys,
            getDocLink: mockGetDocLink,
            setDocLink: mockSetDocLink,
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
      //////////////////////////
     /////// Test suite ///////
    //////////////////////////
*/

beforeAll((done) => {
    // Start the server before all tests run
    CronTask.start();
    done();
});

afterAll((done) => {
    if (server && server.listening) {
        server.close(() => {
            console.log('Server closed!');
            if (CronTask && CronTask.stop) {
                CronTask.stop();
            }
            done(); // Call `done` here to ensure it's called after server is closed and cronTask is stopped
        });
    } else {
        if (CronTask && CronTask.stop) {
            CronTask.stop();
        }
        done(); // Call `done` if server is not running or not defined
    }
});

afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks(); // Resets usage data and implementations
});

describe('GET /getIPranges', () => {
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
        const userSetting = [
            {
                userID: "userID3",
                leftDash: { "Asset List": 1 },
                rightDash: { "Graph View": 1 },
                darkmode: false
            }
        ];
        userConfigHandler.getUserSettings.mockResolvedValue(userSetting);

        const response = await request(app)
            .get('/getUserConfigurations')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            userSettings: userSetting
        });
    });

    test('responds with user settings when the user is authenticated and data is fetched successfully. No setting exist for requesting user.', async () => {
        const responseAxios = axios.get.mockResolvedValue({ data: { authenticated: true, userID: 'mock-user-id' } }); // Mock axios for successful authentication
        const UserConfigHandler = require('../DatabaseConn/userConfigurationConn');
        const userConfigHandler = new UserConfigHandler();

        // Assume successful fetch from database
        mockConnect.mockResolvedValue(true);
        const userSetting = [
            {
                userID: 'mock-user-id',
                leftDash: { "Graph View": 1 },
                rightDash: { "Asset List": 1 },
                darkmode: false
            }
        ];
        userConfigHandler.getUserSettings.mockResolvedValue([]); // Empty array 

        const response = await request(app)
            .get('/getUserConfigurations')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            userSettings: userSetting
        });
    });
});

describe('POST /UpdateUserConfig', () => {
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

describe('GET /getOSSAPIkeyInternal', () => {
    test('responds with OSS API key on successful fetch', async () => {
        const expectedApiKey = "sample-api-key-1234";
        mockConnect.mockResolvedValue(true);
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();
        configHandler.getOSSAPIkey.mockResolvedValue(expectedApiKey);
        const response = await request(app).get('/getOSSAPIkeyInternal');
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ apikey: expectedApiKey });
    });

    test('responds with 500 Internal Server Error when database connection fails', async () => {
        mockConnect.mockRejectedValue(new Error('Database connection error'));
        const response = await request(app).get('/getOSSAPIkeyInternal');
        expect(response.status).toBe(500);
        expect(response.text).toContain('Error fetching OSS API key');
    });
});

describe('POST /updateOSSAPIkey', () => {
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

describe('GET /getTrelloKeys', () => {

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).get('/getTrelloKeys').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 500 Internal Server Error if there is an error fetching the Trello API information', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();

        // Simulate a failure in the database operation
        configHandler.getTrelloKeys.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .get('/getTrelloKeys')
            .set('Authorization', 'Bearer valid_token');

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error fetching Trello keys');
    });

    test('GET /getTrelloKeys should return Trello keys on successful authentication and retrieval', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } });

        const trelloINFO = {
            apiKey: 'mockAPIkeyFILLERFILLERFILLERFILL',
            token: 'VERYLONGMOCKTOKENMADETOSIMULATETHEIMMENSELENGTHOFTHETOKENAAAAAAAAAAAAAAAAAAA',
            boardId: 'https://trello.com/b/mocklink/'
        }
        mockGetTrelloKeys.mockResolvedValue(trelloINFO);

        const response = await request(app)
            .get('/getTrelloKeys')
            .set('Authorization', 'Bearer valid-token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(trelloINFO);
        expect(mockConnect).toHaveBeenCalled();
        expect(mockGetTrelloKeys).toHaveBeenCalled();
    });
});

describe('POST /updateTrelloKeys', () => {

    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).post('/updateTrelloKeys').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with 500 Internal Server Error if there is an error adding the Trello API information', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } }); // Mock axios for successful authentication
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();

        // Simulate a failure in the database operation
        configHandler.updateTrelloKeys.mockRejectedValue(new Error('Database error'));
        const trelloINFO = {
            apiKey: 'mockAPIkeyFILLERFILLERFILLERFILL',
            token: 'VERYLONGMOCKTOKENMADETOSIMULATETHEIMMENSELENGTHOFTHETOKENAAAAAAAAAAAAAAAAAAA',
            boardId: 'https://trello.com/b/mocklink/'
        }

        const response = await request(app)
            .post('/updateTrelloKeys')
            .set('Authorization', 'Bearer valid_token')
            .send(trelloINFO);

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error updating Trello keys');
    });

    test('POST updateTrelloKeys should should update sucessfully', async () => {
        // Mock the response for the authenticated user
        axios.get.mockResolvedValue({ data: { authenticated: true } });

        // Create an instance of ConfigHandler and mock the methods
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();
        configHandler.updateTrelloKeys.mockResolvedValue();
        configHandler.connect.mockResolvedValue();

        const trelloINFO = {
            apiKey: 'mockAPIkeyFILLERFILLERFILLERFILL',
            token: 'VERYLONGMOCKTOKENMADETOSIMULATETHEIMMENSELENGTHOFTHETOKENAAAAAAAAAAAAAAAAAAA',
            boardId: 'https://trello.com/b/mocklink/'
        };

        // Make the POST request using supertest
        const response = await request(app)
            .post('/updateTrelloKeys')
            .set('Authorization', 'Bearer valid_token')
            .send(trelloINFO);

        // Assertions to verify the behavior
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ responseFromServer: "Succeeded to update Trello keys!", success: "success" });
        expect(configHandler.updateTrelloKeys).toHaveBeenCalledWith(trelloINFO);
    });
});

describe('POST /setDocLink', () => {
    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).post('/setDocLink').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with success when doc link is set correctly', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } });
        const docLink = "http://example.com/doc";
        const assetId = "12345";

        mockConnect.mockResolvedValue(true);  // Assume successful database connection
        const ConfigHandler = require('../DatabaseConn/configdbconn');
        const configHandler = new ConfigHandler();
        configHandler.setDocLink.mockResolvedValue();  // Mock successful operation

        const response = await request(app)
            .post('/setDocLink')
            .send({ doclink: docLink, assetid: assetId });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            responseFromServer: "Server.js: Succeeded to add doc link",
            success: "success",
            doclink: docLink
        });
    });

    test('responds with error when there is a database failure', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } });
        const docLink = "http://example.com/doc";
        const assetId = "12345";

        mockConnect.mockRejectedValue(new Error('Database connection error'));

        const response = await request(app)
            .post('/setDocLink')
            .send({ doclink: docLink, assetid: assetId });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error adding doc link');
    });
});

describe('POST /getDocLink', () => {
    test('responds with 401 Unauthorized if the user is not authenticated', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: false } });
        const response = await request(app).post('/getDocLink').set('Authorization', 'Bearer fake_token');
        expect(response.status).toBe(401);
        expect(response.text).toBe('Invalid token');
    });

    test('responds with error when there is a database failure', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } });
        const assetId = "12345";

        mockConnect.mockRejectedValue(new Error('Database connection error'));

        const response = await request(app)
            .post('/getDocLink')
            .send({ assetid: assetId });

        expect(response.status).toBe(500);
        expect(response.text).toContain('Error fetching doc link');
    });

    test('responds with success when doc link is retrieved correctly', async () => {
        axios.get.mockResolvedValue({ data: { authenticated: true } });
        const assetId = "12345";
        const docLink = "http://example.com/doc";

        mockConnect.mockResolvedValue(true);  // Assume successful database connection
        mockGetDocLink.mockResolvedValue(docLink);  // Mock successful fetch

        const response = await request(app)
            .post('/getDocLink')
            .send({ assetid: assetId });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            responseFromServer: "Succeeded to fetch doc link",
            success: "success",
            assetid: assetId,
            doclink: docLink
        });
    });

});
