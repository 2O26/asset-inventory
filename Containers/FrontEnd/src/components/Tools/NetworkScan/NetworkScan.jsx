import React, { useState } from 'react';
import './NetworkScan.css';
import { StartNetScan, GetIPranges, GetState } from '../../Services/ApiService';
import { useQuery, useMutation } from '@tanstack/react-query';

import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import { CheckIcon, CrossIcon, InfoIcon } from '../../common/Icons/Icons';

export default function NetworkScanPage() {
    const [deployedNetscan, setDeployedNetscan] = useState(false);
    const [failedNetscan, setFailedNetscan] = useState(false);

    const { refetch: getStateRefetch } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: false
    });

    const [scanSettings, setScanSettings] = useState({
        cmdSelection: '', // or null, if you prefer
        IPRanges: []
    });

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['IPranges'],
        queryFn: GetIPranges,
        enabled: true
    });

    const { mutate, isPending, isError: isErrorMut, error: errorMut } = useMutation({
        mutationFn: StartNetScan,
        onSuccess: (data) => {
            if (data.success) {
                setDeployedNetscan(true);
                setFailedNetscan(false)
                getStateRefetch()
            } else {
                // TODO: Error handle if erronous response
                // - Error 1: Not responding
                // - Error 2: Already scanning
                setDeployedNetscan(false);
                setFailedNetscan(true)
                console.log("Could not start scan");
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("Scan error:", error);
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

        setScanSettings(prevSettings => {
            // Copy the current list of selected IP ranges
            const updatedIPRanges = [...prevSettings.IPRanges];

            if (isChecked) {
                // Add the IP range to the list if it is checked and not already included
                if (!updatedIPRanges.includes(range)) {
                    updatedIPRanges.push(range);
                }
            } else {
                // Remove the IP range from the list if it is unchecked
                const index = updatedIPRanges.indexOf(range);
                if (index !== -1) {
                    updatedIPRanges.splice(index, 1);
                }
            }

            return {
                ...prevSettings,
                IPRanges: updatedIPRanges
            };
        });
    };


    const attemptToScan = (event) => {
        event.preventDefault();
        console.log(scanSettings);
        setDeployedNetscan(false);
        mutate(scanSettings);

    }

    return (
        <div className="page-container">
            <div className="scan-form-container">
                <h1 style={{ color: "var(--text-color)", marginTop: "0.5rem", marginBottom: "0.5rem" }}> Network Scan Config</h1>
                <form onSubmit={attemptToScan}>
                    <div className='cmd-selection'>
                        <p className='text-desc'> Scan type: </p>

                        <div className="radio-container">
                            <label className='cmd-radio-label'>
                                <p className='text-desc'> Simple scan </p>
                                <InfoIcon size={25} text={"This scan retrieves the following info: IP, Subnet, Status"} />
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
                                <InfoIcon size={25} text={"This scan retrieves the following info: IP, Subnet, Status, Open ports"} />
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
                        <p className='text-desc'> Subnet: </p>
                        {isLoading && <LoadingSpinner />}
                        {isError && <div className='errorMessage'>{error.message}</div>}
                        {data && Array.isArray(data.ipranges) && data.ipranges.map((iprange, index) => (
                            <label className='range-checkbox-label' key={index}>
                                <p className='text-desc'>{iprange}</p>
                                <input
                                    type="checkbox"
                                    value={iprange}
                                    name="rangetype"
                                    checked={scanSettings.IPRanges.includes(iprange)}
                                    onChange={changeScanRange}
                                />
                            </label>
                        ))}
                    </div>


                    <button
                        className='standard-button'
                        disabled={isPending || !scanSettings.cmdSelection || scanSettings.IPRanges.length === 0}
                        type="submit">
                        <div> Start scan </div>
                    </button>
                    <div>
                        {isPending && <LoadingSpinner />}
                        {deployedNetscan &&
                            <div className='resultText'>
                                <p className='successText'> <CheckIcon size={30} color="var(--success-color)" /> Successfully scanned subnet </p>
                            </div>
                        }
                        {failedNetscan &&
                            <div className='resultText'>
                                <p className='successText'> <CrossIcon size={30} color="var(--error-color)" /> Failed to scan subnet </p>
                            </div>
                        }
                    </div>
                </form>
            </div>
        </div>
    )
}
