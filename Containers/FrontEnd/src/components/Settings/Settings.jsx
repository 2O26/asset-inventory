import React, { useState } from 'react'
import SetNetworkScanSettings from './SetNetworkScanSettings/SetNetworkScanSettings';
import DasboardSettings from './DasboardSettings/DashboardSettings';
import RecurringScanSettings from './RecurringScanSettings/RecurringScanSettings';
import RenderOnRole from '../ProtectedRoutes/RenderOnRole';
import CVEScanSettings from './CVEScanner/CVEScannerSettings';
import TrelloSettings from './TrelloSettings/TrelloSettings';
import './Settings.css'

const settingsDict = {
    "Dashboard Settings": <DasboardSettings />,
    "Network Scan Settings": <RenderOnRole roles={['admin']}><SetNetworkScanSettings /></RenderOnRole>,
    "Recurring Scan Settings": <RenderOnRole roles={['admin']}>< RecurringScanSettings /></RenderOnRole>,
    "CVE Scan Settings": <RenderOnRole roles={['admin']}>< CVEScanSettings /></RenderOnRole>,
    "Issue Board Settings": <RenderOnRole roles={['admin']}><TrelloSettings /></RenderOnRole>
};

export default function Settings() {
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
            {Object.entries(settingsDict).map(([key, component]) => {
                return (
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
                )
            })}
        </div>
    );
}

