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
    try {
        const response = await fetch('http://localhost:3001/addIPranges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ iprange: IPRange })
        });
        const resData = await response.json();
        // console.log(resData);
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not fetch state');
    }
}

export const RmIPrange = async (IPRange) => {
    try {
        const response = await fetch('http://localhost:3001/removeIPrange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ iprange: IPRange })
        });
        const resData = await response.json();
        // console.log(resData);
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not fetch state');
    }
}

export const GetIPranges = async (IPRange) => {
    const response = await fetch('http://localhost:3001/getIPranges');
    if (!response.ok) {
        throw new Error('Network response was not ok, could not fetch state');
    }
    return response.json();
}

export const UpdateAsset = async (data) => {
    try {
        const response = await fetch('http://localhost:8080/UpdateAsset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resData = await response.json();
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not fetch state');
    }
}