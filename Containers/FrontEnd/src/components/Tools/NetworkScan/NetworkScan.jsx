import React, { useState } from 'react';
import './NetworkScan.css';
import { startNetScan } from '../../Services/ApiService';
import { InfoIcon } from '../../common/Icons/Icons';

export default function NetworkScanPage() {
    const [cmdSelection, setCmdSelection] = useState();
    const [inputRanges, setInputRanges] = useState({});
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    const changeScanCMD = (event) => {
        setCmdSelection(event.target.value);
    }

    const changeScanRange = (event) => {
        const range = event.target.value;
        const isChecked = event.target.checked;

        // Update the inputRanges state to reflect the change
        setInputRanges(prevRanges => ({
            ...prevRanges,
            [range]: isChecked
        }));
    };

    return (
        <div>
            <h1 style={{ color: "var(--text-color)", marginTop: "4rem" }}> Network Scan Config</h1>
            <div className='cmd-selection'>
                <p className='text-desc'> Please select a scan type: </p>
                <form>
                    <div className="radio-container">
                        <label className='cmd-radio-label'>
                            <p className='text-desc'> Simple scan </p>
                            <div className="info-icon-container">
                                <span className="info-icon">ℹ️</span>
                                <div className="info-content">
                                    This scan retrieves the following info: IP, MAC, HOST name
                                </div>
                            </div>
                            <input
                                type="radio"
                                value="Command 1"
                                name="scantype"
                                checked={cmdSelection === 'Command 1'}
                                onChange={changeScanCMD}
                            />
                        </label>
                    </div>
                    <div className="radio-container">
                        <label className='cmd-radio-label'>
                            <p className='text-desc'> Extensive scan </p>
                            <div className="info-icon-container">
                                <span className="info-icon">ℹ️</span>
                                <div className="info-content">
                                    This scan retrieves the following info: IP, MAC, HOST name, Vulnerble services, CVEs associated to vulnerbilities
                                </div>
                            </div>
                            <input
                                type="radio"
                                value="Command 2"
                                name="scantype"
                                checked={cmdSelection === 'Command 2'} // Control the component
                                onChange={changeScanCMD} // Handle the change
                            />
                        </label>
                    </div>
                    {/* Add more radio buttons as needed */}
                </form>
                {/* <p className='text-desc'> Selected Value: {cmdSelection}</p> */}
            </div>

            <div>
                <div className='IPField'>
                    <p className='text-desc'> Please select an IP range or subnet to scan: </p>
                    {/* <input
                        type="text"
                        value={inputRange}
                        onChange={handleInputChange}
                    /> */}
                    <form>
                        {/* TO DO: Dynamically fetch these from the configuration/settings page */}
                        <div className="checkbox-container">
                            <label className='range-checkbox-label'>
                                <p className='text-desc'> 10.10.1.0/24 </p>
                                <input
                                    type="checkbox"
                                    value="10.10.1.0/24"
                                    name="rangetype"
                                    checked={inputRanges["10.10.1.0/24"] || false}
                                    onChange={changeScanRange}
                                />
                            </label>
                        </div>
                        <div className="checkbox-container">
                            <label className='range-checkbox-label'>
                                <p className='text-desc'> 192.168.1.1-192.168.1.24 </p>
                                <input
                                    type="checkbox"
                                    value="192.168.1.1-192.168.1.24"
                                    name="rangetype"
                                    checked={inputRanges["192.168.1.1-192.168.1.24"] || false} // Control the component
                                    onChange={changeScanRange} // Handle the change
                                />
                            </label>
                        </div>
                        <div className="checkbox-container">
                            <label className='range-checkbox-label'>
                                <p className='text-desc'> 172.168.1.0/32 </p>
                                <input
                                    type="checkbox"
                                    value="172.168.1.0/32"
                                    name="rangetype"
                                    checked={inputRanges["172.168.1.0/32"] || false} // Control the component
                                    onChange={changeScanRange} // Handle the change
                                />
                            </label>
                        </div>
                    </form>
                </div>
                {/* <div>
                    <p className='text-desc'>The input value is: {inputRange}</p>
                </div> */}
            </div>
            <div className='buttonContainer'>
                <button className='standard-button' onClick={startNetScan}>
                    <div> Start scan </div>
                </button>
            </div>
        </div>
    )
}
