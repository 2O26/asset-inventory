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
    // console.log("cmdSelection", scanSettings.cmdSelection);
    // console.log("IPRanges: ", scanSettings.IPRanges);

    try {
        const response = await fetch('http://localhost:8081/startNetScan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scanSettings)
        });

        const resData = await response.json();
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not fetch state');
    }
    // if (!response.ok) {
    //     throw new Error('Network response was not ok, could not fetch state');
    // }
    // return response.json();
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
        throw new Error('Network response was not ok, could not add IP range');
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
        throw new Error('Network response was not ok, could not remove IP range');
    }
}

export const GetIPranges = async () => {
    try {
        const response = await fetch('http://localhost:3001/getIPranges');
        return response.json();
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch IP ranges');
    }
}

export const UpdateAsset = async (data) => {
    console.log("Edit Data:", data);
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