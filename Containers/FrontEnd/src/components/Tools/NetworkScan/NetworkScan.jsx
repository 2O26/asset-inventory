import React, { useState } from 'react';
import './NetworkScan.css';
import { StartNetScan, GetIPranges } from '../../Services/ApiService';
import { useQuery, useMutation } from '@tanstack/react-query';

import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";

export default function NetworkScanPage() {
    // const [IPRanges, setIPRanges] = useState({});
    const [scanSettings, setScanSettings] = useState({
        cmdSelection: '', // or null, if you prefer
        IPRanges: {}
    });

    const { data, isLoadingQue, isErrorQue, error, refetch } = useQuery({
        queryKey: ['IPranges'],
        queryFn: GetIPranges,
        enabled: true
    });

    const { mutate, isLoading, isError } = useMutation({
        mutationFn: StartNetScan, // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            if (data.success) {

            } else {
                console.log("Could not start scan");
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("Login error:", error);
        }
    });

    const changeScanCMD = (event) => {
        setScanSettings(prevSettings => ({
            ...prevSettings,
            cmdSelection: event.target.value
        }));
    };

    const changeScanRange = (event) => {
        const range = event.target.value;
        const isChecked = event.target.checked;

        // Update the IPRanges part of the state
        setScanSettings(prevSettings => ({
            ...prevSettings,
            IPRanges: {
                ...prevSettings.IPRanges,
                [range]: isChecked
            }
        }));
    };

    const attemptToScan = (event) => {
        event.preventDefault();
        // Use mutate with the input data

        // TODO: Uncomment
        mutate(scanSettings);

        // TODO: Error handle if erronous response
        // - Error 1: Not responding
        // - Error 2: Already scanning
    }

    return (
        <div>
            <h1 style={{ color: "var(--text-color)", marginTop: "4rem" }}> Network Scan Config</h1>
            <form onSubmit={attemptToScan}>
                <div className='cmd-selection'>
                    <p className='text-desc'> Please select a scan type: </p>

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
                                value="simple"
                                name="scantype"
                                checked={scanSettings.cmdSelection === 'simple'}
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
                                value="extensive"
                                name="scantype"
                                checked={scanSettings.cmdSelection === 'extensive'} // Control the component
                                onChange={changeScanCMD} // Handle the change
                            />
                        </label>
                    </div>

                </div>

                <div className='IPField'>
                    <p className='text-desc'> Please select an IP range or subnet to scan: </p>
                    {data && Array.isArray(data.ipranges) && data.ipranges.map((iprange, index) => (
                        <label className='range-checkbox-label' key={index}>
                            <p className='text-desc'>{iprange}</p>
                            <input
                                type="checkbox"
                                value={iprange}
                                name="rangetype"
                                checked={scanSettings.IPRanges[iprange] || false}
                                onChange={changeScanRange}
                            />
                        </label>
                    ))}
                </div>

                {isLoading && <LoadingSpinner />}
                <div className='buttonContainer'>
                    <button className='standard-button' disabled={isLoading} type="submit">
                        <div> Start scan </div>
                    </button>
                </div>
            </form>
        </div>
    )
}
