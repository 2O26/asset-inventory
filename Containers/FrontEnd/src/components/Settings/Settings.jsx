import React from 'react'
import SetNetworkScanSettings from './SetNetworkScanSettings/SetNetworkScanSettings'

export default function Settings() {
    return (
        <div>
            <div>
                <h1 style={{ color: "var(--text-color)", marginTop: "4rem" }}>Settings</h1>
            </div>
            <div className='netScanConfig'>
                <SetNetworkScanSettings />
            </div>
        </div>
    )
}
