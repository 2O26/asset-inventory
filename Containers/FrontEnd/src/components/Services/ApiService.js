// ApiServices.js
import UserService from './UserService';

export const AssetHandlerStatus = async () => {
    // assethandler status check

    if (UserService.tokenExpired()) {
        await UserService.updateToken()
    }
    const authToken = UserService.getToken();
    const response = await fetch('http://localhost:8080/assetHandlerStatus', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const return_data = await response.json();
    return return_data;
};

export const GetState = async (ipRanges = []) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }
        const authToken = UserService.getToken();

        const formData = new FormData();
        for (let i = 0; i < ipRanges.length; i++) {
            formData.append("subnets", ipRanges[i])
        }

        const response = await fetch('http://localhost:8080/getLatestState', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const return_data = await response.json();

        return return_data;
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch asset data ');
    }
};

export const StartNetScan = async (scanSettings) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }

        const authToken = UserService.getToken();

        const response = await fetch('http://localhost:8081/startNetScan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(scanSettings)
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const resData = await response.json();

        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not fetch state');
    }
}

export const CreateRealmRole = async (IPRange) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }

        const authToken = UserService.getToken()

        const response = await fetch("http://localhost:8085/admin/realms/master/roles", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                name: IPRange,
                description: `Has access to subnet: ${IPRange}`
            })
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response;
        // Handle success response
    } catch (error) {
        console.error('There was an error!', error);
        throw new Error('There was an error when creating role');
        // Handle the error
    }
}

export const DeleteRealmRole = async (IPRange) => {

    const encodedRoleName = encodeURIComponent(IPRange);

    if (UserService.tokenExpired()) {
        await UserService.updateToken()
    }

    const authToken = UserService.getToken()

    const getRoleIdByName = async () => {
        const url = `http://localhost:8085/admin/realms/master/roles/${encodedRoleName}`;
        // const url = `http://localhost:8085/admin/realms/master/roles/wassa`;

        const requestOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        };

        try {
            const response = await fetch(url, requestOptions);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.id;
        } catch (error) {
            console.error('There was an error!', error);
            return null;
        }
    };

    const deleteRoleById = async (roleId) => {
        const url = `http://localhost:8085/admin/realms/master/roles-by-id/${roleId}`;

        const requestOptions = {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        };

        try {
            const response = await fetch(url, requestOptions);
            return response;
        } catch (error) {
            console.error('There was an error!', error);
            // Handle the error
        }
    };

    const roleId = await getRoleIdByName();
    if (roleId) {
        const response = await deleteRoleById(roleId);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response;
    } else {
        console.error('Role ID not found for the given role name');
        throw new Error('Role ID not found for the given role name');
    }
}

export const GetIPranges = async () => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }
        const authToken = UserService.getToken()

        const response = await fetch('http://localhost:3001/getIPranges', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            }
        });

        const return_data = await response.json();
        return return_data;
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch IP ranges');
    }
}

export const AddIPranges = async (IPRange) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }
        const authToken = UserService.getToken()

        const response = await fetch('http://localhost:3001/addIPranges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ iprange: IPRange })
        });
        const resData = await response.json();
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not add IP range');
    }
}

export const RmIPrange = async (IPRange) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }
        const authToken = UserService.getToken()

        const response = await fetch('http://localhost:3001/removeIPrange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ iprange: IPRange })
        });
        const resData = await response.json();
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not remove IP range');
    }
}

export const GetRecurring = async () => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }
        const authToken = UserService.getToken()

        const response = await fetch('http://localhost:3001/getRecurring', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            }
        });
        const resData = await response.json();
        return resData;

    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch reoccuring scans');
    }
}

export const AddRecurring = async (recurring) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }
        const authToken = UserService.getToken()

        const response = await fetch('http://localhost:3001/addRecurring', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
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
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }
        const authToken = UserService.getToken()

        const response = await fetch('http://localhost:3001/removeRecurring', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ recurring: recurring })
        });
        const resData = await response.json();
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not remove reoccuring scan');
    }
}

export const UpdateAsset = async (data) => {

    if (UserService.tokenExpired()) {
        await UserService.updateToken()
    }
    const authToken = UserService.getToken()

    const response = await fetch('http://localhost:8080/assetHandler', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        return response.json().then(error => {
            throw new Error(error.error || 'Something went wrong.');
        });
    }
    const resData = await response.json();
    return resData;
}

export const UploadCycloneDX = async (data) => {
    const uploadURL = 'http://localhost:8082/uploadCycloneDX';

    try {

        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }

        const authToken = UserService.getToken();

        const response = await fetch(uploadURL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
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
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }

        const authToken = UserService.getToken()

        const response = await fetch('http://localhost:3001/UpdateUserConfig', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Assuming the data is JSON. Adjust if necessary.
                'Authorization': `Bearer ${authToken}`,
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
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }

        const authToken = UserService.getToken();

        const response = await fetch('http://localhost:3001/getUserConfigurations', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const result = await response.json()
        return result;
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch user settings');
    }
}

export const GetCDXfiles = async (assetID) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }

        const authToken = UserService.getToken();

        const response = await fetch('http://localhost:8082/getCycloneDXFile?assetID=' + assetID, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        const return_data = await response.json();
        return return_data;
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch CycloneDX info');
    }
}

export const RemoveCDXfile = async (assetID) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }

        const authToken = UserService.getToken();

        const formData = new FormData();
        formData.append('assetID', assetID)
        const response = await fetch('http://localhost:8082/removeCycloneDX', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
            body: formData
        })
        const return_data = await response.json();
        return return_data;
    } catch (err) {
        console.error(err);
        throw new Error('Could not remove CycloneDX file');
    }
}

export const RemoveLibsGivenSBOMRemoval = async (assetID) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }
        const authToken = UserService.getToken()

        const response = await fetch('http://localhost:3002/removeAssetidLibs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ assetID: assetID })
        })
        if (!response.ok) {
            // Handle HTTP errors, e.g., response status 404, 500, etc.
            const errorText = await response.text();
            console.error('HTTP Error:', response.status, errorText);
            throw new Error(`HTTP Error ${response.status}: ${errorText}`);
        }

        const return_data = await response.json();
        return return_data;
    } catch (err) {
        console.error(err);
        throw new Error('Could not remove CycloneDX file');
    }
}

export const UpdateAPIOSSkey = async (apikey) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }

        const authToken = UserService.getToken();
        const response = await fetch('http://localhost:3001/updateOSSAPIkey', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ apikey: apikey })
        });
        const resData = await response.json();
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not add API key');
    }
}

export const GetOSSAPIkey = async () => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }

        const authToken = UserService.getToken();

        const response = await fetch('http://localhost:3001/getOSSAPIkey', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const resData = await response.json();
        return resData;

    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch API key');
    }
}

export const CheckAPIOSSkey = async (apitoken) => {

    try {
        const response = await fetch('http://localhost:3002/checkAPIkey', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${apitoken}`
            }
        });
        const resData = await response.json();
        console.log("response data: ", resData)
        return resData;

    } catch (err) {
        console.error(err);
        throw new Error('Could not validate API key');
    }
}

export const GetAllSBOMLibraries = async () => {

    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken()
        }

        const authToken = UserService.getToken();

        const response = await fetch('http://localhost:3002/getAllLibraries', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const result = await response.json();
        return result;
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch user settings');
    }
}

export const GetVulnerbleComponents = async (assetID) => {
    try {

        if (UserService.tokenExpired()) {
            UserService.updateToken()
        }
        const authToken = UserService.getToken()

        const response = await fetch('http://localhost:3002/getVulnerableAssetID', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Assuming the data is JSON. Adjust if necessary.
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ "assetID": assetID })
        });

        const return_data = await response.json();
        return return_data;
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch CVE info');
    }
}

export const GetVulnerbleComponentsAll = async (assetID) => {
    try {

        if (UserService.tokenExpired()) {
            UserService.updateToken()
        }
        const authToken = UserService.getToken()

        const response = await fetch('http://localhost:3002/getVulnerableAssetAll', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json', // Assuming the data is JSON. Adjust if necessary.
                'Authorization': `Bearer ${authToken}`,
            }
        });
        const return_data = await response.json();

        return return_data;
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch CVE info');
    }
}

export const RecheckVulnerbleComponentsAll = async () => {
    try {

        if (UserService.tokenExpired()) {
            UserService.updateToken()
        }
        const authToken = UserService.getToken()

        const response = await fetch('http://localhost:3002/recheckVulnerabilitiesAll', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json', // Assuming the data is JSON. Adjust if necessary.
                'Authorization': `Bearer ${authToken}`,
            }
        });
        const return_data = await response.json();

        return return_data;
    } catch (err) {
        console.error(err);
        throw new Error('Could not recheck vulnerable libraries');
    }
}

export const GetHistory = async (assetID) => {
    try {

        if (UserService.tokenExpired()) {
            UserService.updateToken()
        }
        const authToken = UserService.getToken()

        const bodyData = assetID ? `?assetID=${assetID}` : ''
        const response = await fetch(`http://localhost:8080/GetTimelineData${bodyData}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Assuming the data is JSON. Adjust if necessary.
                    'Authorization': `Bearer ${authToken}`,
                }
            }
        );

        const return_data = await response.json();

        return return_data;
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch event history ');
    }
}

export const UpdateTrelloKeys = async (trelloKeys) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken();
        }
        const authToken = UserService.getToken();
        const response = await fetch('http://localhost:3001/updateTrelloKeys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(trelloKeys)
        });
        const resData = await response.json();
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not update Trello keys');
    }
}

export const GetTrelloKeys = async () => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken();
        }
        const authToken = UserService.getToken();
        const response = await fetch('http://localhost:3001/getTrelloKeys', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const resData = await response.json();
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch Trello keys');
    }
}

export const SetDocLink = async (docLinkData) => {
    const docLink = docLinkData.link;
    const assetID = docLinkData.assetID;
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken();
        }
        const authToken = UserService.getToken();
        const response = await fetch('http://localhost:3001/setDocLink', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ doclink: docLink, assetid: assetID })
        });
        const resData = await response.json();
        return resData;
    } catch (err) {
        console.error(err);
        throw new Error('Network response was not ok, could not add Doc Link');
    }
}

export const GetDocLink = async (assetID) => {
    try {
        if (UserService.tokenExpired()) {
            await UserService.updateToken();
        }
        const authToken = UserService.getToken();
        const response = await fetch('http://localhost:3001/getDocLink', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ assetid: assetID })
        });

        const return_data = await response.json();
        return return_data.doclink;
    } catch (err) {
        console.error(err);
        throw new Error('Could not fetch Doc Link');
    }
}