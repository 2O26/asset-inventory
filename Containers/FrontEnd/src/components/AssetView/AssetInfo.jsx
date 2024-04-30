import React, { useState } from 'react'
import {string} from "prop-types";

export function isDate(value) {
    const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    return isoPattern.test(value);
}

export function toLocalTime(utcDateString) {
    const utcDate = new Date(Date.parse(utcDateString));
    return utcDate.toLocaleString();
}


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
                                    <button onClick={() => toggleListVisibility(key)} className='arrow-container'>
                                        {expandedLists[key] ? <i className="arrow down"></i> : <i className="arrow up"></i>}
                                    </button>
                                    {expandedLists[key] && (
                                        <ul>
                                            {value.map((item, index) => (
                                                <li className="asset-item-list" key={index} id={`${key}_${index}`} style={{ width: "fit-content", minWidth: "40%" }}> {index + 1} : {item}</li>
                                            ))}
                                        </ul>
                                    )}
                            </div>) :
                            (
                                index === 0 ? <h1 key={key} className="asset-name">{value}</h1> :
                                    (
                                        <div className="assetItem">{key}: {isDate(value) ? toLocalTime(value) : value}</div>
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
                                        <span className="key-value">
                                            {key === "Last Discovered at" ? toLocalTime(value) : value}
                                        </span>
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
