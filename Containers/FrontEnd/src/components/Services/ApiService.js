// ApiServices.js
import UserService from './UserService';


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

export const StartNetScan = async (scanSettings) => {
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

export const GetIPranges = async () => {
    try {
        const response = await fetch('http://localhost:3001/getIPranges');
        return response.json();
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch IP ranges');
    }
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

export const GetRecurring = async () => {
    try {
        const response = await fetch('http://localhost:3001/getRecurring');
        return response.json();

    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch reoccuring scans');
    }
}

export const AddRecurring = async (recurring) => {
    try {
        const response = await fetch('http://localhost:3001/addRecurring', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recurring)
        });
        const resData = await response.json();
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not add reoccuring scan');
    }
}

export const RmRecurring = async (recurring) => {
    try {
        const response = await fetch('http://localhost:3001/removeRecurring', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recurring: recurring })
        });
        const resData = await response.json();
        // console.log(resData);
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not remove reoccuring scan');
    }
}

export const UpdateAsset = async (data) => {
    const response = await fetch('http://localhost:8080/assetHandler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        return response.json().then(error => {
            throw new Error(error.error || 'Something went wrong.');
        });
    }
    return response.json();
}

export const UploadCycloneDX = async (data) => {
    const uploadURL = 'http://localhost:8082/uploadCycloneDX';

    try {
        const response = await fetch(uploadURL, {
            method: 'POST',
            body: data,
        });

        if (response.ok) {
            const data = await response.json();
            alert('File uploaded successfully');
            return data;
            // Handle success scenario (e.g., showing the uploaded file's details)
        } else {
            // Handle server errors or invalid responses
            const data = await response.json();
            alert('Failed to upload file');
            return data;
        }
    } catch (error) {
        // Handle network errors
        alert('Error uploading file: ' + error.message);
    }
}


export const SaveUserSetting = async (data) => {
    try {
        const response = await fetch('http://localhost:3001/UpdateUserConfig', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Assuming the data is JSON. Adjust if necessary.
                'Authorization': `Bearer ${UserService.getToken()}`,
            },
            body: JSON.stringify(data)
        });

        const resData = await response.json();
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not add user configuration');
    }
};

export const GetUserSettings = async () => {
    try {
        const response = await fetch('http://localhost:3001/getUserConfigurations', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${UserService.getToken()}`
            }
        });
        return response.json();
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch user settings');
    }
}

export const GetCDXfiles = async (assetID) => {
    try {
        const response = await fetch('http://localhost:8082/getCycloneDXFile?assetID=' + assetID);
        const return_data = await response.json();
        // console.log('http://localhost:8082/getCycloneDXFile?assetID=' + assetID)
        // console.log(return_data);
        return return_data;
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch CycloneDX info');
    }
}