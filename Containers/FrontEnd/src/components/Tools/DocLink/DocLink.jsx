import { useState } from 'react';
import { GetOSSAPIkey2 } from '../../Services/ApiService';

export const fetchAndOpenLink = async () => {
    try {
        const resData = await GetOSSAPIkey2(); // Call the function to get the link
        const link = resData.apikey; // Assuming 'link' is the key in resData containing the URL
        window.open(link, '_blank'); // Open the link in a new tab
    } catch (error) {
        console.error(error);
        // Handle error appropriately, e.g., display an error message
    }
};
