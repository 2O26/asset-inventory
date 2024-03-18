import React, { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { GetState } from '../Services/ApiService'
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import './AssetView.css';
import { AssetInfo } from './AssetInfo';
import GraphView from '../Tools/GraphView/GraphView';
import EditAsset from './EditAsset';

export default function AssetView() {
    let { assetID } = useParams();
    const [selectedView, setSelectedView] = useState('Information');
    const [filteredRelations, setFilteredRelations] = useState([]);
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: true
    });

    const handleButtonClick = (view) => {
        setSelectedView(view);
    }

    const filterRelationsByAID = (aid) => {
        // Filtering the relations
        const filtered = Object.entries(data.state.relations).filter(([key, value]) =>
            value.from === aid || value.to === aid
        ).reduce((acc, [key, value]) => {
            // Reconstructing the filtered relations object
            acc[key] = value;
            return acc;
        }, {});

        setFilteredRelations(filtered);
    };

    useEffect(() => {
        if (assetID && data) {
            filterRelationsByAID(assetID)
        }
    }, [assetID, data])


    if (isLoading) return <LoadingSpinner />
    if (isError) return <div className='errorMessage'>{error.message}</div>
    // if (!data.state.assets[assetID]) return <Navigate to='/' />;
    // if (!data.state.assets[assetID]) return <div>No asset data!</div>;


    return (
        <div className='asset-view-container'>
            {/* Button Section */}
            <GraphView selectedAsset={assetID} />
            {data.state.assets[assetID] &&

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
                        <EditAsset assetData={data.state.assets[assetID]} assetID={assetID} relationData={filteredRelations}></EditAsset>)}
                </div>
            }
        </div>
    );
}