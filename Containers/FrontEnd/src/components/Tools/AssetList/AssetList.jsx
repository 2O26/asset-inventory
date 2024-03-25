import React, { useEffect, useState } from 'react';
import './AssetList.css';
import { useNavigate } from 'react-router-dom';
import AddAsset from '../../AddAsset/AddAsset';
import RemoveAsset from '../../RemoveAsset/RemoveAsset';
import { GetState } from '../../Services/ApiService';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import { SearchIcon } from '../../common/Icons/Icons';

const getColumnHeaders = (data) => {
    const columnHeaders = new Set(['Select']);
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

export default function AssetList() {
    const navigate = useNavigate();
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: true
    });
    const [filteredAssets, setFilteredAssets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [checkedItems, setCheckedItems] = useState({});
    const [isRemoveVisible, setIsRemoveVisible] = useState(false);

    useEffect(() => {
        if (data) {
            const columnHeaders = getColumnHeaders(data);
            if (searchTerm === '') {
                setFilteredAssets(Object.entries(data.state.assets));
            } else {
                const filteredAssets = Object.entries(data.state.assets).filter(([key, value]) => {
                    return value.properties[columnHeaders[1]].toLowerCase().includes(searchTerm.toLowerCase());
                });
                setFilteredAssets(filteredAssets);
            }

            const initialCheckState = Object.keys(data.state.assets).reduce((acc, key) => {
                acc[key] = false;
                return acc;
            }, {});
            setCheckedItems(initialCheckState);
        }
    }, [data, searchTerm]);

    const handleClick = (assetID) => {
        navigate(`/asset-view/${assetID}`);
    }

    const handleCheckboxChange = (id) => {
        setCheckedItems(prevState => {
            const newState = {
                ...prevState,
                [id]: !prevState[id]
            };

            const anyChecked = Object.values(newState).some(checked => checked);
            setIsRemoveVisible(anyChecked);

            return newState;
        });
    };

    const handleAssetRemoval = () => {
        setIsRemoveVisible(false);
        setCheckedItems({});
        refetch();
    };

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <div className='errorMessage'>{error.message}</div>;

    return (
        <div className='page-container'>
            <div><SearchBar onSearch={setSearchTerm} /></div>
            <div className='asset-list-container'>
                <div className='headerRow'>
                    {data && getColumnHeaders(data).map(header => (
                        <div key={header} className={`headerCell ${header === 'Select' ? 'checkbox-header' : ''}`}>
                            {header}
                        </div>
                    ))}
                </div>

                <hr style={{ margin: "0.5rem 2rem ", border: "1px solid var(--text-color)" }}></hr>
                {filteredAssets.map(([key, value]) => (
                    <div key={key} className='assetRow'>
                        <div className='assetCell'>
                            <input
                                type="checkbox"
                                checked={checkedItems[key] || false}
                                onChange={() => handleCheckboxChange(key)}
                            />
                        </div>
                        {Object.keys(value.properties).map((header, headerIndex) => {
                            return (
                                <div
                                    key={headerIndex}
                                    className='assetCell'
                                    onClick={() => handleClick(key)}
                                >
                                    {value.properties[header]}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <div className='actions-container'>
                <AddAsset />
                {isRemoveVisible && (
                    <RemoveAsset
                        checkedItems={checkedItems}
                        onAssetRemoved={handleAssetRemoval}
                    />
                )}
            </div>
        </div>
    );
}