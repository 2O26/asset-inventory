import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AssetView.css';

export default function AssetView() {
    const postData = useLocation();
    const navigate = useNavigate();
    const [expandedLists, setExpandedLists] = useState({}); // To track which lists are expanded

    useEffect(() => {
        if (!postData.state) {
            navigate('/');
        }
    }, [postData.state, navigate]);

    const toggleListVisibility = (key) => {
        setExpandedLists((prevExpandedLists) => ({
            ...prevExpandedLists,
            [key]: !prevExpandedLists[key],
        }));
    };

    if (!postData.state) {
        return <div>Loading...</div>;
    }

    return (
        <div className='asset-view-container'>
            <div className='asset-info-container'>
                <div key={postData.state.Standard.Name}>
                    {/* Standard information */}
                    {Object.entries(postData.state.Standard).map(([key, value], index) => (
                        index === 0 ? <h1 key={key} name="asset-name">{value}</h1> : (
                            <div key={key} className='assetItem'>
                                {key}: {value}
                            </div>
                        )
                    ))}

                    {/* Separator */}
                    <hr />

                    {/* Plugin information */}
                    {Object.values(postData.state.Plugin).map((plugin, pluginIndex, pluginArray) => (
                        <React.Fragment key={pluginIndex}>
                            {Object.entries(plugin).map(([key, value]) => {
                                const isList = Array.isArray(value);
                                return (
                                    <div key={key} className='assetItem'>
                                        <span className="key-value">{key}: </span>
                                        {isList ? (
                                            <>
                                                <button onClick={() => toggleListVisibility(key)} className='arrow-container'>
                                                    {expandedLists[key] ? <i className="arrow down"></i> : <i className="arrow up"></i>}
                                                </button>
                                                {expandedLists[key] && (
                                                    <ul>
                                                        {value.map((item, index) => (
                                                            <li key={index}>{item}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </>
                                        ) : (
                                            <span>{value}</span>
                                        )}
                                    </div>

                                );
                            })}
                            {pluginIndex < pluginArray.length - 1 && <hr />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}