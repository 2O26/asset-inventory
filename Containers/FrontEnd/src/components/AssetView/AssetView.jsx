import React, { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { GetState } from '../Services/ApiService'
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import './AssetView.css';
import { AssetInfo } from './AssetInfo';

export default function AssetView() {
    let { assetID } = useParams();
    const [selectedView, setSelectedView] = useState('Information');
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: true
    });

    const handleButtonClick = (view) => {
        setSelectedView(view);
    }

    if (isLoading) return <LoadingSpinner />
    if (isError) return <div className='errorMessage'>{error.message}</div>
    if (!data.state.assets[assetID]) return <Navigate to='/' />;

    return (
        <div className='asset-view-container'>
            {/* Button Section */}
            <div className='button-plus-info'>
                <div className="button-container">
                    <button
                        className={`tab-button ${selectedView === 'Information' ? 'active-button' : ''}`}
                        onClick={() => handleButtonClick('Information')}
                    >
                        Information
                    </button>
                    <button
                        className={`tab-button ${selectedView === 'History' ? 'active-button' : ''}`}
                        onClick={() => handleButtonClick('History')}
                    >
                        History
                    </button>
                    <button
                        className={`tab-button ${selectedView === 'Edit' ? 'active-button' : ''}`}
                        onClick={() => handleButtonClick('Edit')}
                    >
                        Edit
                    </button>
                </div>
                {/* Conditionally render content based on selectedView */}
                {selectedView === 'Information' && (
                    <AssetInfo data={data} assetID={assetID} showPluginInfo={true} ></AssetInfo>)}
                {selectedView === 'History' && (
                    <AssetInfo data={data} assetID={assetID} title={"History Page"} showPluginInfo={false}></AssetInfo>)}
                {selectedView === 'Edit' && (
                    <AssetInfo data={data} assetID={assetID} title={"Edit Page"} showPluginInfo={false}></AssetInfo>)}
            </div>
        </div>
    );
}