import { useState } from 'react';
import { getDocLink } from '../../Services/ApiService';

export const RedirectToDocumentation = async () => {
    try {
        const resData = await getDocLink(); // Call the function to get the link
        const link = resData.apikey; // Assuming 'apikey' is the key in resData containing the URL
        window.open(link, '_blank'); // Open the link in a new tab
    } catch (error) {
        console.error(error);
        // Handle error appropriately, e.g., display an error message

        // Fallback to a default link if fetching the API key fails
        const fallbackLink = 'https://github.com/assetinventory-org/asset-inventory';
        window.open(fallbackLink, '_blank'); // Open the fallback link in a new tab
    }
};
