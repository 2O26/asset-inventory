// ApiServices.js

export const AssetHandlerStatus = async () => {
    // assethandler status check

    const response = await fetch('/assetHandlerStatus');

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

export const GetLatestStatus = async () => {
    
}

export const EditLatestStatus = async () => {
    
}

export const LogIn = async (userData) => {
    console.log("Email: ", userData.email, ", Password: ", userData.password);

    // Simulate an API call
    const response = await new Promise((resolve) => {
        setTimeout(() => resolve({ "success": true }), 1000); // Simulate async operation
    });

    return response; // No need to call .json() on a plain object
};

