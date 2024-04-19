import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from "@tanstack/react-query";
import cronstrue from 'cronstrue';

import { GetIPranges, AddRecurring, GetRecurring, RmRecurring } from '../../Services/ApiService';
import Plugins from '../../Tools/Plugins';

import './RecurringScanSettings.css'
import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import { InfoIcon, RemoveIcon } from "../../common/Icons/Icons";
import CronMap from './CronMap'

export default function RecurringScanSettings() {
    const [expandAddCronSettings, setExpandAddCronSettings] = useState(false);
    const [iprange, setIprange] = useState('');
    const [timeinterval, setTimeinterval] = useState("* * * * *");
    const [pluginType, setPluginType] = useState(Plugins.length > 0 ? Plugins[0] : '');
    const [addRecurringSuccess, setRecurringSuccess] = useState(false);
    const [addRecurringFail, setRecurringFail] = useState(false);
    const [recurringFromAdd, setRecurringFromAdd] = useState(false);
    const [readableExpression, setReadableExpression] = useState('');

    const usageText = ""

    const { mutate: mutateAdd, isPending: isPendingMutAdd, isError: isErrorMutAdd, error: errorMutAdd } = useMutation({
        mutationFn: AddRecurring, // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            if (data.success === "success") {
                setRecurringFromAdd(data.recurring); // If I want to use the data
                setRecurringFail(false);
                setRecurringSuccess(true);
                refetchRecurring();
                console.log(data.recurring)
                // console.log("IP range added sucessfully:", data);
            }
            else {
                setRecurringSuccess(false);
                setRecurringFail(true);
                console.log("Could not add IP range sucessfully. Error: ", data.success);
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("SetNetworkScanSettings error: ", error);
        }
    });

    const { mutate: mutateRm, isPending: isPendingMutRm, isError: isErrorMutRm, error: errorMutRm } = useMutation({
        mutationFn: RmRecurring, // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            if (data.success === "success") {
                // setReoccuringFromAdd(data.recurring); // If I want to use the data
                setRecurringFail(false);
                setRecurringSuccess(false);
                refetchRecurring();
                // console.log("IP range added sucessfully:", data);
            }
            else {
                setRecurringSuccess(false);
                console.log("Could not add IP range sucessfully. Error: ", data.success);
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("SetNetworkScanSettings error: ", error);
        }
    });

    const { data: recurringData, isLoading: isLoadingRecurring, isError: isErrorRecurring, error: errorRecurring, refetch: refetchRecurring } = useQuery({
        queryKey: ['Recurring'],
        queryFn: GetRecurring,
        enabled: true
    });


    const { data: ipRangesData, isLoading: isLoadingIpRanges, isError: isErrorIpRanges, refetch: refetchIpRanges } = useQuery({
        queryKey: ['IPranges'],
        queryFn: GetIPranges,
        enabled: true
    });


    const expandCronSettings = (event) => {
        setExpandAddCronSettings(!expandAddCronSettings);
        setRecurringFail(false);
        setRecurringSuccess(false);
    }

    const addRecurringScan = (event) => {
        event.preventDefault();
        mutateAdd({ recurring: { time: timeinterval, IpRange: iprange, plugin: pluginType } });
        setTimeinterval("* * * * *");
        setRecurringSuccess(false);
        setRecurringFail(false);
    }

    const handleIPChange = (event) => {
        setIprange(event.target.value);
    };

    const handlePluginChange = (event) => {
        console.log(event.target.value);
        setPluginType(event.target.value);
    };

    const handleTimeChange = (event) => {
        setTimeinterval(event.target.value);
    };

    const removeRecurringScan = (recurring) => {
        mutateRm(recurring);
    };

    const handleRemoveClick = (recurring) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            removeRecurringScan(recurring);
        }
    };

    useEffect(() => {
        if (ipRangesData && Array.isArray(ipRangesData.ipranges)) {
            setIprange(ipRangesData.ipranges[0]);
        }
        try {
            const humanReadable = cronstrue.toString(timeinterval);
            setReadableExpression(humanReadable);
        } catch (error) {
            console.error("Error parsing cron expression", error);
            setReadableExpression("Invalid cron expression");
        }
    }, [ipRangesData, timeinterval]);

    if (!recurringData || !Array.isArray(recurringData.recurring) || recurringData.recurring === null) {
        // TODO : return error
        return <div>No recurring data available.</div>;
    }

    if (!ipRangesData || !Array.isArray(ipRangesData.ipranges) || ipRangesData.ipranges === null) {
        // TODO : return error
        return <div>No IP range data available.</div>;
    }

    return (
        <div className='reoccurringkScan-container'>
            {/* <h2>
                Cron Settings
            </h2> */}
            <div>
                <p className="settingsText"> Current recurring scans:</p>
                {(isLoadingRecurring || isPendingMutAdd || isPendingMutRm) && <LoadingSpinner />}
                {isErrorRecurring && <div className='errorMessage'>{errorRecurring.message}</div>}
                <ul>

                    {recurringData.recurring.map((plugin, index) => (
                        <li key={index} className='list-container'>
                            <span className="span-text">{plugin.plugin}: {plugin.time} {plugin.IpRange}</span>
                            <button
                                onClick={() => handleRemoveClick({ plugin: plugin.plugin, time: plugin.time, IpRange: plugin.IpRange })}
                                className="remove-btn"
                                title="Remove recurring scan"
                                aria-label='Remove'
                            >
                                <span className="tooltip-text">Remove Cron Job</span>
                                <RemoveIcon color={"var(--error-color)"} />
                            </button>
                        </li>
                    ))}
                </ul>

            </div>

            <div>
                {expandAddCronSettings ? null : <button className='standard-button' onClick={expandCronSettings}> Add Scan Job</button>}
                {
                    expandAddCronSettings ?
                        <div>
                            <form onSubmit={addRecurringScan}>
                                <div>
                                    <p className='settingsText'>  IP range to recurringly scan: </p>
                                    <select className='select-container' value={iprange} onChange={handleIPChange}>
                                        {ipRangesData.ipranges.map((iprange, index) => (
                                            <option key={iprange}>
                                                {iprange}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <div className='settingsText'>  Time interval to perform the scan
                                        <InfoIcon size={22} component={CronMap} />
                                        : </div>
                                    <input
                                        type="RecurringScanTime"
                                        id="RecurringScanInputTime"
                                        name="RecurringScanTime"
                                        value={timeinterval} // Set the value of the input to the state
                                        onChange={handleTimeChange} // Update the state when the input changes
                                        className='inputFields'
                                        placeholder='e.g. 0 0 * * 1'
                                    >
                                    </input>
                                </div>
                                <div className='interval-text'>Interval: {readableExpression}.</div>
                                <div>
                                    <p className='settingsText'>  Plugin type: </p>
                                    <select className='select-container' value={pluginType} onChange={handlePluginChange}>
                                        {Plugins.map((plugintype, index) => (
                                            <option key={plugintype}>
                                                {plugintype}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {isPendingMutAdd && <LoadingSpinner />}
                                {addRecurringSuccess &&
                                    <div>
                                        <p className='successText'>Successfully added recurring scan ✅</p>
                                    </div>
                                }
                                {addRecurringFail &&
                                    <div>
                                        <p className='successText'> Failed to add recurring scan. Wrong format. ❌</p>
                                    </div>
                                }
                                {/* {isErrorMutRm && <div className='errorMessage'>{errorMutRm.message}</div>} */}
                                {isErrorMutAdd && <div className='errorMessage'>{errorMutAdd.message}</div>}
                                <div className='buttonContainerNetScan'>
                                    <button className='standard-button' disabled={isPendingMutAdd} type="submit">
                                        <div> Add Job </div>
                                    </button>
                                    <button className='standard-button' onClick={expandCronSettings}>
                                        <div> Cancel </div>
                                    </button>
                                </div>
                            </form>
                        </div> : null
                }
            </div>
        </div>
    )
}


