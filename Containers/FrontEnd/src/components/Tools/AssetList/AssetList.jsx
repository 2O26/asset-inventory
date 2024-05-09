import React, { useEffect, useRef, useState } from 'react';
import './AssetList.css';
import { useNavigate } from 'react-router-dom';
import AddAsset from '../../AddAsset/AddAsset';
import RemoveAsset from '../../RemoveAsset/RemoveAsset';
import { GetState } from '../../Services/ApiService';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import { SearchIcon } from '../../common/Icons/Icons';
import { isDate, toLocalTime } from "../../AssetView/AssetInfo";

const NarrowList = ['Name', 'Owner', 'Type', 'Criticality', 'IP']

const getColumnHeaders = (data, isNarrowView, isDashboard) => {
    const columnHeaders = new Set();
    !isDashboard && columnHeaders.add('Select'); // Assuming 'Select' is a special column for checkboxes
    if (!isNarrowView) {
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
    const componentRef = useRef(null);
    const [isNarrowView, setIsNarrowView] = useState(false);
    const [filteredAssets, setFilteredAssets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [checkedItems, setCheckedItems] = useState({});
    const [isRemoveVisible, setIsRemoveVisible] = useState(false);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: true,
    });

    useEffect(() => {
        const updateIsNarrowView = () => {
            if (componentRef.current) {
                const screenWidth = window.innerWidth;
                const componentWidth = componentRef.current.getBoundingClientRect().width;

                // Determine if the component width is less than 50vw
                // setIsNarrowView(componentWidth < (0.5 * screenWidth));
                setIsNarrowView(componentWidth < 916);
                console.log("narrow:", componentWidth < (0.5 * screenWidth));
            }
        };

        updateIsNarrowView(); // Run initially

        // Set up ResizeObserver to handle dynamic resizing
        const resizeObserver = new ResizeObserver(updateIsNarrowView);
        if (componentRef.current) {
            resizeObserver.observe(componentRef.current);
        }

        return () => {
            if (componentRef.current) {
                resizeObserver.unobserve(componentRef.current);
            }
        };
    }, []);

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

    function processCellObject(header, value) {
        let item = null;
        if (header === "Type") {
            return value.properties[header][0];
        }
        item = value.properties[header];
        if (isDate(item)) {
            return toLocalTime(item);
        }
        return item;
    }

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <div className='errorMessage'>{error.message}</div>;

    return (

        <div className='page-container'>
            {!isDashboard && <div><SearchBar onSearch={setSearchTerm} /></div>}

            <div className='asset-list-container' ref={componentRef} style={{ width: width, height: height }}>
                <div className='headerRow'>
                    {data && getColumnHeaders(data, isNarrowView, isDashboard).map(header => (
                        <div key={header} className={`headerCell ${header === 'Select' ? 'checkbox-header' : ''}`}>
                            {header}
                        </div>
                    ))}
                </div>
                <hr />
                {filteredAssets.map(([key, value]) => (
                    <div key={key} className='assetRow' id={key}>
                        {(!isDashboard) && (
                            <div onClick={() => handleCheckboxChange(key)} className='assetCell'>
                                <input
                                    type="checkbox"
                                    checked={checkedItems[key] || false}
                                />
                            </div>
                        )}
                        {Object.keys(value.properties).filter(header => !isNarrowView || NarrowList.includes(header)).map((header, headerIndex) => (
                            <div
                                key={headerIndex}
                                className='assetCell'
                                onClick={() => handleClick(key)}
                            >
                                {processCellObject(header, value)}
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
