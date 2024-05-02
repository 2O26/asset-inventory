import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from "@tanstack/react-query";
import { GetDocLink, SetDocLink } from '../Services/ApiService';

export default function DocLink({ assetID }) {
    const [inputLink, setInputLink] = useState('');

    const handleSetLink = async () => {
        try {
            await SetDocLink(inputLink, assetID);
            alert('Doc Link set successfully');
            setInputLink(''); // Clear the input field after setting the link
        } catch (error) {
            alert('Failed to set doc link: ' + error.message);
        }
    };

    const handleOpenLink = async () => {
        try {
            let docLink = await GetDocLink(assetID);
            if (!docLink.startsWith('http://') && !docLink.startsWith('https://')) {
                docLink = 'https://' + docLink;
            }
            window.open(docLink, '_blank'); // Open the retrieved link in a new tab
        } catch (error) {
            window.open('https://github.com/assetinventory-org/asset-inventory', '_blank'); // Open the retrieved link in a new tab
            alert('Failed to get doc link: ' + error.message);
        }
    };
    
    const handleCheckLink = async () => {
        try {
            let docLink = await GetDocLink(assetID);
            if (!docLink.startsWith('http://') && !docLink.startsWith('https://')) {
                docLink = 'https://' + docLink;
            }
            return docLink;
        } catch (error) {
            return <div>There is currently no documentation link, or it could not be retrieved.</div>
        }
    };


    return (
        <div className='asset-info-container'>
            <h3 style={{ marginBottom: '1rem' }}>Set Documentation Link</h3>
            <input
                type='text'
                value={inputLink}
                onChange={(e) => setInputLink(e.target.value)}
                placeholder='Enter documentation link...'
                style={{ marginRight: '1rem' }}
            />
            <button onClick={handleSetLink}>Set Link</button>

            <h3 style={{ marginBottom: '1rem', marginTop: '2rem' }}>Open Documentation Link</h3>
            <button onClick={handleOpenLink}>Open Link</button>
        </div>
    );
}
