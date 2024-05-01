import { useState } from 'react';
import { GetDocLink, SetDocLink } from '../Services/ApiService';

export default function DocLink({ assetID }) {
    const [inputLink, setInputLink] = useState('');

    const handleSetLink = async () => {
        //console.log("DocLink.jsx Set Doc Link")
        try {
            await SetDocLink(inputLink, assetID);
            alert('Doc Link set successfully');
            setInputLink(''); // Clear the input field after setting the link
        } catch (error) {
            alert('Failed to set doc link: ' + error.message);
        }
    };

    const handleOpenLink = async () => {
        //console.log("DocLink.jsx Get Doc Link")
        try {
            const docLink = await GetDocLink(assetID);
            window.open(docLink, '_blank'); // Open the retrieved link in a new tab
        } catch (error) {
            window.open('https://github.com/assetinventory-org/asset-inventory', '_blank'); // Open the retrieved link in a new tab
            alert('Failed to get doc link: ' + error.message);
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
