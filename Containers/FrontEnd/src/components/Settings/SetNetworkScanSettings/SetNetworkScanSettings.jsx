import React, { useState } from 'react'
import './SetNetworkScanSettings.css'
import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import { AddIPranges, GetIPranges, RmIPrange } from '../../Services/ApiService';
import { useMutation, useQuery } from "@tanstack/react-query";
import { RemoveIcon } from "../../common/Icons/Icons";


export default function SetNetworkScanSettings() {
    const [expandAddIPrange, setExpandAddIPrange] = useState(false);
    const [IPRange, setIPRange] = useState("");
    const [addIPRangeSuccess, setAddIPRangeSuccess] = useState(false);
    const [addIPRangeFail, setAddIPRangeFail] = useState(false);
    const [rangeFromAdd, setRangeFromAdd] = useState();

    const { mutate: mutateAdd, isPending: isPendingMutAdd, isError: isErrorMutAdd, error: errorMutAdd } = useMutation({
        mutationFn: AddIPranges, // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            if (data.success === "success") {
                setRangeFromAdd(data.range); // If I want to use the data
                setAddIPRangeFail(false);
                setAddIPRangeSuccess(true);
                refetch();
                // console.log("IP range added sucessfully:", data);
            } else if (data.success === "wrong format") {
                setAddIPRangeSuccess(false);
                setAddIPRangeFail(true);
                // console.log("Could not add IP range sucessfully");
            }
            else {
                setAddIPRangeSuccess(false);
                console.log("Could not add IP range sucessfully. Error: ", data.success);
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("SetNetworkScanSettings error: ", error);
        }
    });

    const { mutate: mutateRm, isPending: isPendingMutRm, isError: isErrorMutRm, error: errorMutRm } = useMutation({
        mutationFn: RmIPrange, // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            if (data.success === "success") {
                setRangeFromAdd(data.range); // If I want to use the data
                setAddIPRangeFail(false);
                setAddIPRangeSuccess(true);
                refetch();
                // console.log("IP range added sucessfully:", data);
            } else if (data.success === "wrong format") {
                setAddIPRangeSuccess(false);
                setAddIPRangeFail(true);
                // console.log("Could not add IP range sucessfully");
            }
            else {
                setAddIPRangeSuccess(false);
                console.log("Could not add IP range sucessfully. Error: ", data.success);
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("SetNetworkScanSettings error: ", error);
        }
    });


    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['IPranges'],
        queryFn: GetIPranges,
        enabled: true
    });

    const addIPrange = (event) => {
        event.preventDefault();
        // console.log(IPRange);
        mutateAdd(IPRange);
        setIPRange("");
        setAddIPRangeSuccess(false);
        setAddIPRangeFail(false);
    }


    const handleChange = (event) => {
        setIPRange(event.target.value);
    };

    const expandIPrange = (event) => {
        setExpandAddIPrange(!expandAddIPrange);
        setAddIPRangeSuccess(false);
        setAddIPRangeFail(false);
        // console.log(data.ipranges)
    };

    const removeIpRange = (iprange) => {
        mutateRm(iprange);
    };

    const handleRemoveClick = (iprange) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            removeIpRange(iprange);
        }
    };


    return (
        <div>
            {/* <div className='networkScanTitleConfig'>
                <h2 > Network Scan Settings</h2>
            </div> */}
            <div className=''>
                <div>
                    <p className='settingsText'> Current IP ranges:</p>
                    {(isLoading || isPendingMutAdd || isPendingMutRm) && <LoadingSpinner />}
                    {isError && <div className='errorMessage'>{error.message}</div>}
                    <ul>
                        {data && Array.isArray(data.ipranges) && data.ipranges.map((iprange, index) => (
                            <li key={index} className='list-container'>
                                <span className="span-text">{iprange}</span>
                                <button
                                    onClick={() => handleRemoveClick(iprange)}
                                    className="remove-btn"
                                    // title="Remove IP range"
                                    aria-label='Remove'
                                >
                                    <span className="tooltip-text">Remove IP range</span>
                                    < RemoveIcon color={"var(--error-color)"}> </RemoveIcon>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    {expandAddIPrange ? null : <button className='standard-button' onClick={expandIPrange}> Add IP range</button>}
                    {expandAddIPrange ? <div>
                        <p className='settingsText'>  Enter IP range to add: </p>
                        <form onSubmit={addIPrange}>
                            <input
                                type="IP range"
                                id="IPrangeInput"
                                name="IPrangeInput"
                                value={IPRange} // Set the value of the input to the state
                                onChange={handleChange} // Update the state when the input changes
                                className='ip-range-input'
                            >
                            </input>
                            {isPendingMutAdd && <LoadingSpinner />}
                            {addIPRangeSuccess &&
                                <div>
                                    <p className='successText'>Successfully added IP range: {rangeFromAdd} ✅</p>
                                </div>
                            }
                            {addIPRangeFail &&
                                <div>
                                    <p className='successText'> Failed to add IP range: {rangeFromAdd}. Wrong format. ❌</p>
                                </div>
                            }
                            {isErrorMutRm && <div className='errorMessage'>{errorMutRm.message}</div>}
                            {isErrorMutAdd && <div className='errorMessage'>{errorMutAdd.message}</div>}
                            <div className='buttonContainerNetScan'>
                                <button className='standard-button' disabled={isPendingMutAdd} type="submit">
                                    <div> Add IP range </div>
                                </button>
                                <button className='standard-button' onClick={expandIPrange}>
                                    <div> Cancel </div>
                                </button>
                            </div>
                        </form>
                    </div> : null}
                </div>
            </div>

        </div >

    )
}
