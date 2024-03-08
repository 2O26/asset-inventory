import React, { useState } from 'react'
import './SetNetworkScanSettings.css'
import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import { AddIPranges, GetIPranges } from '../../Services/ApiService';
import { useMutation, useQuery } from "@tanstack/react-query";

export default function SetNetworkScanSettings() {
    const [expandAddIPrange, setExpandAddIPrange] = useState(false);
    const [IPRange, setIPRange] = useState("");

    const { mutate, isLoadingMut, isErrorMut } = useMutation({
        mutationFn: AddIPranges, // Directly pass the LogIn function
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

    const { data, isLoadingQue, isErrorQue, error, refetch } = useQuery({
        queryKey: ['IPranges'],
        queryFn: GetIPranges,
        enabled: false // TODO: Change to true!!
    });

    const addIPrange = (event) => {
        event.preventDefault();
        console.log(IPRange);
        mutate(IPRange);
    }


    const handleChange = (event) => {
        setIPRange(event.target.value);
    };
    const expandIPrange = (event) => {
        setExpandAddIPrange(!expandAddIPrange);
    };

    return (
        <div>
            <div className='networkScanTitleConfig'>
                <h2 style={{ color: "var(--text-color)", marginTop: "4rem" }}> Network Scan Settings</h2>
            </div>
            <div className='rangeConfigIP'>
                <p className='scansettingsText'> Current IP ranges:</p>
                <div>
                    {expandAddIPrange ? null : <button className='standard-button' onClick={expandIPrange}> Add IP range</button>}
                    {expandAddIPrange ? <div>
                        <p className='scansettingsText'>  Enter IP range to add: </p>
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
                            {isLoadingMut && <LoadingSpinner />}
                            <div className='buttonContainer'>
                                <button className='standard-button' disabled={isLoadingMut} type="submit">
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

        </div>

    )
}
