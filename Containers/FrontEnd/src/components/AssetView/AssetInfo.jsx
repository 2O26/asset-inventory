import React, { useState } from 'react'

export const AssetInfo = ({ data, assetID, title, showPluginInfo }) => {
    const [expandedLists, setExpandedLists] = useState({}); // To track which lists are expanded

    const toggleListVisibility = (key) => {
        setExpandedLists((prevExpandedLists) => ({
            ...prevExpandedLists,
            [key]: !prevExpandedLists[key],
        }));
    };

    return (
        <div className='asset-info-container' >
            <div>{title}</div>
            <div key={data.state.assets && data.state.assets[assetID] ? data.state.assets[assetID].properties.name : 'defaultKey'}>
                {/* Standard information */}
                {data.state.assets && data.state.assets[assetID] && Object.entries(data.state.assets[assetID].properties).map(([key, value], index) => {
                    const isList = Array.isArray(value);
                    return (
                        isList ? (
                            <div key={key} className='assetItem'>
                                <span className="key-value">{key}: </span>
                                <>
                                    <button onClick={() => toggleListVisibility(key)} className='arrow-container'>
                                        {expandedLists[key] ? <i className="arrow down"></i> : <i className="arrow up"></i>}
                                    </button>
                                    {expandedLists[key] && (
                                        <ul>
                                            {value.map((item, index) => (
                                                <li key={index} id={`${key}_${index}`} style={{ width: "fit-content", minWidth: "40%" }}> {index + 1} : {item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            </div>) :
                            (
                                index === 0 ? <h1 key={key} name="asset-name">{value}</h1> :
                                    (
                                        <div key={key} className='assetItem'>
                                            {key}: {value}
                                        </div>
                                    )
                            )
                    )
                })}

                <hr />

                {/* Plugin information */}
                {data.state.assets && data.state.assets[assetID] && showPluginInfo && Object.values(data.state.assets[assetID].plugins).map((plugin, pluginIndex, pluginArray) => (
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
        </div >
    )
}
