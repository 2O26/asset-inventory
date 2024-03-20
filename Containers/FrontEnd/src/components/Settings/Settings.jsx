import React, { useState } from 'react'
import SetNetworkScanSettings from './SetNetworkScanSettings/SetNetworkScanSettings'
import DasboardSettings from './DasboardSettings/DasboardSettings'
import './Settings.css'

const settingsDict = {
    "Network Scan Settings": <SetNetworkScanSettings />,
    "Dashboard Settings": <DasboardSettings />
};

export default function Settings() {
    const [selectedView, setSelectedView] = useState('Information');
    // Initialize visibility states for each section based on settingsDict
    const [visibilityStates, setVisibilityStates] = useState(
        Object.keys(settingsDict).reduce((acc, key) => {
            acc[key] = false; // Start with all sections closed
            return acc;
        }, {})
    );

    // Function to toggle visibility of a section
    const toggleVisibility = (section) => {
        setVisibilityStates(prevState => ({
            ...prevState,
            [section]: !prevState[section]
        }));
    };

    return (
        <div className='center-flex-column'>
            {Object.entries(settingsDict).map(([key, component]) => (
                <div key={key}>
                    <div
                        className={visibilityStates[key] ? "settings-header show-content" : "settings-header"}
                        onClick={() => toggleVisibility(key)}
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                        {key}
                        <button className='arrow-container'>
                            {visibilityStates[key] ? <i className="arrow down"></i> : <i className="arrow up"></i>}
                        </button>
                    </div>
                    {visibilityStates[key] && (
                        <div className='settings-container'>
                            {component}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

