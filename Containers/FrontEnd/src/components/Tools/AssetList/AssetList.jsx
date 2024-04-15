import React, { useEffect, useState } from 'react';
import './AssetList.css';
import { useNavigate } from 'react-router-dom';
import AddAsset from '../../AddAsset/AddAsset';
import RemoveAsset from '../../RemoveAsset/RemoveAsset';
import { GetState } from '../../Services/ApiService';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import { SearchIcon } from '../../common/Icons/Icons';

const NarrowList = ['Name', 'Owner', 'Type', 'Criticality']

const getColumnHeaders = (data, isNarrowView, isDashboard) => {
    const columnHeaders = new Set();
    if (!isNarrowView) {
        !isDashboard && columnHeaders.add('Select'); // Assuming 'Select' is a special column for checkboxes
        Object.values(data.state.assets).forEach(asset => {
            Object.keys(asset.properties).forEach(key => columnHeaders.add(key));
        });
    } else {
        // Add only the important columns for narrow view
        NarrowList.forEach(key => columnHeaders.add(key));
    }

    return Array.from(columnHeaders);
};

export function SearchBar({ onSearch }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleInputChange = (event) => {
        const term = event.target.value;
        setSearchTerm(term);
        onSearch(term);
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

export default function AssetList({ width = "95vw", height = "84vh", isDashboard = false }) {
    const navigate = useNavigate();
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: true,
    });
    const [filteredAssets, setFilteredAssets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [checkedItems, setCheckedItems] = useState({});
    const [isRemoveVisible, setIsRemoveVisible] = useState(false);

    // Dynamically adjust based on viewport width
    const matches = width.match(/\d+/);
    const numberPart = parseInt(matches[0], 10)
    const isNarrowView = numberPart < 60; // Example breakpoint

    useEffect(() => {
        if (data) {
            const initialCheckState = Object.keys(data.state.assets).reduce((acc, key) => {
                acc[key] = false;
                return acc;
            }, {});
            setCheckedItems(initialCheckState);

            const newFilteredAssets = searchTerm === '' ? Object.entries(data.state.assets) :
                Object.entries(data.state.assets).filter(([key, value]) => {
                    return value.properties.Name.toLowerCase().includes(searchTerm.toLowerCase()); // Assuming 'Name' is a searchable field
                });

            setFilteredAssets(newFilteredAssets);
        }
    }, [data, searchTerm]);

    const handleClick = (assetID) => {
        navigate(`/asset-view/${assetID}`);
    };

    const handleCheckboxChange = (id) => {
        setCheckedItems(prevState => {
            const newState = { ...prevState, [id]: !prevState[id] };
            setIsRemoveVisible(Object.values(newState).some(checked => checked));
            return newState;
        });
    };

    const handleAssetRemoval = () => {
        // Implementation for removing checked assets
        setIsRemoveVisible(false);
        setCheckedItems({});
        refetch();
    };

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <div className='errorMessage'>{error.message}</div>;

    return (
        <div className='page-container'>
            {!isDashboard && <div><SearchBar onSearch={setSearchTerm} /></div>}
            <div className='asset-list-container' style={{ width: width, height: height }}>
                <div className='headerRow'>
                    {data && getColumnHeaders(data, isNarrowView, isDashboard).map(header => (
                        <div key={header} className={`headerCell ${header === 'Select' ? 'checkbox-header' : ''}`}>
                            {header}
                        </div>
                    ))}
                </div>
                <hr />
                {filteredAssets.map(([key, value]) => (
                    <div key={key} className='assetRow'>
                        {(!isNarrowView && !isDashboard) && (
                            <div className='assetCell'>
                                <input
                                    type="checkbox"
                                    checked={checkedItems[key] || false}
                                    onChange={() => handleCheckboxChange(key)}
                                />
                            </div>
                        )}
                        {Object.keys(value.properties).filter(header => !isNarrowView || NarrowList.includes(header)).map((header, headerIndex) => (
                            <div
                                key={headerIndex}
                                className='assetCell'
                                onClick={() => handleClick(key)}
                            >
                                {header === "Type" ? value.properties[header][0] : value.properties[header]}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            {!isDashboard &&
                <div className='actions-container'>
                    <AddAsset />
                    {isRemoveVisible && (
                        <RemoveAsset
                            checkedItems={checkedItems}
                            onAssetRemoved={handleAssetRemoval}
                        />
                    )}
                </div>
            }
        </div>
    );
}
