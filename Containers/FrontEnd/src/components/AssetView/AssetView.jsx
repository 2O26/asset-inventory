import React, { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { GetState } from '../Services/ApiService'
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import './AssetView.css';
import { AssetInfo } from './AssetInfo';
import GraphView from '../Tools/GraphView/GraphView';
import EditAsset from './EditAsset';
import { LeftArrow, RightArrow } from '../common/Icons/Icons';
import { CSSTransition } from 'react-transition-group';
import CycloneDX from './CycloneDX';
import History from '../Tools/History/History';
import TrelloTab from './TrelloTab';

export default function AssetView() {
    let { assetID } = useParams();
    const [selectedView, setSelectedView] = useState('Information');
    const [filteredRelations, setFilteredRelations] = useState([]);
    const [assetIDs, setAssetIDs] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true); // Is asset view expanded or not?
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: true
    });

    const handleButtonClick = (view) => {
        setSelectedView(view);
    }

    const getAssetIDs = (jsonData) => {
        // Check if jsonData and jsonData.state.assets exist
        if (!jsonData || !jsonData.state || !jsonData.state.assets) {
            return []; // Return an empty array if the structure is not as expected
        }

        // Return the keys from the assets object, which are the asset IDs
        return Object.keys(jsonData.state.assets);
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
        if (assetID && data && (Object.keys(data.state.assets).length != 0)) {
            filterRelationsByAID(assetID)
            setAssetIDs(getAssetIDs(data))
        }
    }, [assetID, data])


    if (isLoading) return <LoadingSpinner />
    if (isError) return <div className='errorMessage'>{error.message}</div>
    if (Object.keys(data.state.assets).length === 0) return <div className='errorMessage'>No existing assets</div>;
    if (!data.state.assets[assetID]) return <div className='errorMessage'>This asset no longer exists</div>;



    return (
        <div className='asset-view'>

            <GraphView selectedAsset={assetID} />

            <button
                className="toggle-button"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? <RightArrow /> : <LeftArrow />}
            </button>
            <CSSTransition
                in={isExpanded}
                timeout={500} // Match the duration of your CSS transition
                classNames="slide"
                unmountOnExit
            >
                <div className="button-plus-info">
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
                        <button
                            className={`tab-button ${selectedView === 'CycloneDx' ? 'active-button' : ''}`}
                            onClick={() => handleButtonClick('CycloneDx')}
                        >
                            C-DX
                        </button>
                        <button
                            className={`tab-button ${selectedView === 'Trello' ? 'active-button' : ''}`}
                            onClick={() => handleButtonClick('Trello')}
                        >
                            Issue Board
                        </button>
                    </div>
                    {/* Conditionally render content based on selectedView */}
                    {selectedView === 'Information' && (
                        <div className="asset-info">
                            <AssetInfo data={data} assetID={assetID} showPluginInfo={true} ></AssetInfo>
                        </div>)
                    }
                    {selectedView === 'History' && (
                        <History height='100%' width='25vw' assetID={assetID} isDashboard={true} isAssetView={true}></History>)
                    }
                    {selectedView === 'Edit' && (
                        <EditAsset assetData={data.state.assets[assetID]} assetID={assetID} relationData={filteredRelations} refetch={refetch} assetIDs={assetIDs}></EditAsset>)
                    }
                    {selectedView === 'CycloneDx' && (
                        <CycloneDX assetID={assetID} ></CycloneDX>)
                    }
                    {selectedView === 'Trello' && (
                        <TrelloTab assetID={assetID} ></TrelloTab>)
                    }


                </div>
            </CSSTransition>
        </div>
    );
}