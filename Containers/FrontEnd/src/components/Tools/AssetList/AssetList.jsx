import React, { useEffect, useState } from 'react';
import './AssetList.css';
import { useNavigate } from 'react-router-dom';
import AddAsset from '../../AddAsset/AddAsset';
import { GetState } from '../../Services/ApiService';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import { SearchIcon } from '../../common/Icons/Icons'; // Import your icon component


const getColumnHeaders = (data) => {
    const columnHeaders = new Set();
    Object.values(data.state.assets).forEach(asset => {
        Object.keys(asset.properties).forEach(key => columnHeaders.add(key));
    });

    return Array.from(columnHeaders);
};

export function SearchBar({ onSearch }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleInputChange = (event) => {
        const term = event.target.value;
        setSearchTerm(term);
        onSearch(term); // Call onSearch function with the updated search term
    };

    return (
        <div className="SearchBar">
            <div className="searchIconWrapper">
                <SearchIcon size={30} /> 
            </div>
            <div className="inputWrapper">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    placeholder="Search..."
                />
            </div>
        </div>
    );
}

export default function AssetList() {
    const navigate = useNavigate();
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: true
    });
    const [filteredAssets, setFilteredAssets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (data) {
            const columnHeaders = getColumnHeaders(data);
            if (searchTerm === '') {
                // If search term is empty, show all assets
                setFilteredAssets(Object.entries(data.state.assets));
            } else {
                // Filter assets based on the search term
                const filteredAssets = Object.entries(data.state.assets).filter(([key, value]) => {
                    // Check if the name matches the search term (assuming name is the first header)
                    return value.properties[columnHeaders[0]].toLowerCase().includes(searchTerm.toLowerCase());
                });
                setFilteredAssets(filteredAssets);
            }
        }
    }, [data, searchTerm]);

    const handleClick = (assetID) => {
        navigate(`/asset-view/${assetID}`);
    }

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <div className='errorMessage'>{error.message}</div>;

    return (
        <div className='page-container'>
            <div><SearchBar onSearch={setSearchTerm} /></div>
            <div className='asset-list-container'>
                <div className='headerRow'>
                    {Object.keys(data.state.assets).length > 0 && Object.keys(data.state.assets[Object.keys(data.state.assets)[0]].properties).map(header => (
                        <div key={header} className='headerCell'>
                            {header}
                        </div>
                    ))}
                </div>

                <hr style={{ margin: "0.5rem 2rem ", border: "1px solid var(--text-color)" }}></hr>
                {filteredAssets.map(([key, value]) => (
                    <div key={key} className='assetRow' onClick={() => handleClick(key)}>
                        {Object.keys(value.properties).map((header, headerIndex) => {
                            return (
                                <div key={headerIndex} className='assetCell'>
                                    {value.properties[header]}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <AddAsset />
        </div>
    );
};
