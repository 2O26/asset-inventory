// ApiServices.js

export const AssetHandlerStatus = async () => {
    // assethandler status check

    const response = await fetch('/assetHandlerStatus');

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

export const LogIn = async (userData) => {
    console.log("Email: ", userData.email, ", Password: ", userData.password);

    // Simulate an API call
    const response = await new Promise((resolve) => {
        setTimeout(() => resolve({ "success": true }), 1000); // Simulate async operation
    });

    return response; // No need to call .json() on a plain object
};

export const GetState = async () => {
    const response = await fetch('http://localhost:8080/getLatestState');

    if (!response.ok) {
        throw new Error('Network response was not ok, could not fetch state');
    }
    return response.json();
};

export const EditLatestStatus = async () => {

}

export const StartNetScan = async (scanSettings) => {
    console.log("cmdSelection", scanSettings.cmdSelection);
    console.log("IPRanges: ", scanSettings.IPRanges);

    const response = fetch('http://localhost:8081/startNetScan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanSettings)
    });
    if (!response.ok) {
        throw new Error('Network response was not ok, could not fetch state');
    }
    return response.json();
}

export const AddIPranges = async (IPRange) => {
    console.log("IPRange: ", IPRange);
    // TODO: Uncomment 
    const response = fetch('http://localhost:8082/AddIPranges', { // Configuration Container
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });

    if (!response.ok) {
        throw new Error('Network response was not ok, could not fetch state');
    }
    return response.json();
}

export const GetIPranges = async (IPRange) => {
    const response = fetch('http://localhost:8082/GetIPranges');
    if (!response.ok) {
        throw new Error('Network response was not ok, could not fetch state');
    }
    return response.json();
}