import React, { useEffect, useState } from 'react'
import './AssetList.css'
import { useNavigate } from 'react-router-dom';
import AddAsset from '../../AddAsset/AddAsset';
import { GetState } from '../../Services/ApiService'
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';

const getColumnHeaders = (data) => {
    const columnHeaders = new Set();
    Object.values(data.state.assets).forEach(asset => {
        Object.keys(asset.properties).forEach(key => columnHeaders.add(key));
    });

    return Array.from(columnHeaders);
};

export default function AssetList() {
    const navigate = useNavigate()

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: true
    });


    const handleClick = (assetID) => {
        navigate(`/asset-view/${assetID}`);
    }

    if (isLoading) return <LoadingSpinner />
    if (isError) return <div className='errorMessage'>{error.message}</div>
    const columnHeaders = getColumnHeaders(data)

    return (
        <div className='page-container'>
            <div className='asset-list-container'>
                <div className='headerRow'>
                    {columnHeaders.map(header => (
                        <div key={header} className='headerCell'>
                            {header}
                        </div>
                    ))}
                </div>

                <hr style={{ margin: "0.5rem 2rem ", border: "1px solid var(--text-color)" }}></hr>
                {Object.entries(data.state.assets).map(([key, value]) => (
                    <div key={key} className='assetRow' onClick={() => handleClick(key)}>
                        {columnHeaders.map((header, headerIndex) => {
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
