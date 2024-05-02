import React, { useState } from 'react'
import './SetNetworkScanSettings.css'
import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import { AddIPranges, CreateRealmRole, DeleteRealmRole, GetIPranges, RmIPrange } from '../../Services/ApiService';
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckIcon, CrossIcon, RemoveIcon } from "../../common/Icons/Icons";


export default function SetNetworkScanSettings() {
    const [expandAddIPrange, setExpandAddIPrange] = useState(false);
    const [IPRange, setIPRange] = useState("");
    const [rangeFromAdd, setRangeFromAdd] = useState();
    const [wrongFormat, setWrongFormat] = useState(false)

    const { mutate: addRole, isSuccess: successAddRole, isError: errorAddRole, reset: addRoleReset } = useMutation({
        mutationFn: CreateRealmRole, // Directly pass the LogIn function
        onSuccess: (response) => {
            if (response.ok) {
                console.log("Role created!")
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("Role creation error: ", error);
        }
    });

    const { mutate: rmRole, isSuccess: successRmRole, isError: errorRmRole, reset: rmRoleReset } = useMutation({
        mutationFn: DeleteRealmRole, // Directly pass the LogIn function
        onSuccess: (response) => {
            if (response.ok) {
                console.log("Role deleted!")
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("Role deletion error: ", error);
        }
    });

    const { mutate: mutateAdd, isPending: isPendingMutAdd, isSuccess: isSuccessMutAdd, isError: isErrorMutAdd, error: errorMutAdd, reset: addReset } = useMutation({
        mutationFn: AddIPranges, // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            if (data.success === "success") {
                setRangeFromAdd(data.range); // If I want to use the data
                addRole(data.range)
                refetch();
                // console.log("IP range added sucessfully:", data);
            } else if (data.success === "wrong format") {

                // console.log("Could not add IP range sucessfully");
            }
            else {
                console.log("Could not add IP range sucessfully. Error: ", data.success);
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("SetNetworkScanSettings error: ", error);
        }
    });

    const { mutate: mutateRm, isPending: isPendingMutRm, isSuccess: isSuccessMutRm, isError: isErrorMutRm, error: errorMutRm, reset: rmReset } = useMutation({
        mutationFn: RmIPrange, // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            if (data.success === "success") {
                setRangeFromAdd(data.range); // If I want to use the data
                rmRole(data.range)
                refetch();
                // console.log("IP range added sucessfully:", data);
            } else if (data.success === "wrong format") {
                // console.log("Could not add IP range sucessfully");
            }
            else {
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
        resetMutateFn()
        mutateAdd(IPRange);
        setIPRange("");
    }


    const handleChange = (event) => {
        setWrongFormat(false)
        if (!data.ipranges.includes(event.target.value)) {
            setIPRange(event.target.value);
        } else {
            setWrongFormat(true)
        }

    };

    const expandIPrange = (event) => {
        resetMutateFn()
        setExpandAddIPrange(!expandAddIPrange);
        // console.log(data.ipranges)
    };

    const removeIpRange = (iprange) => {
        resetMutateFn()
        mutateRm(iprange);
    };

    const handleRemoveClick = (iprange) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            removeIpRange(iprange);
        }
    };

    const resetMutateFn = () => {
        rmReset()
        addReset()
        rmRoleReset()
        addRoleReset()
    }


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
                    {successAddRole &&
                        <div className='successMessage'>{"Role created: " + rangeFromAdd}</div>
                    }
                    {errorAddRole &&
                        <div className='errorMessage'>{"Error creating role"}</div>
                    }
                    {successRmRole &&
                        <div className='successMessage'>{"Role deleted"}</div>
                    }
                    {errorRmRole &&
                        <div className='errorMessage'>{"Error deleting role"}</div>
                    }
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
                            {isSuccessMutAdd &&
                                <div>
                                    <p className='successText'> <CheckIcon size={30} color="var(--success-color)" /> Successfully added IP range: {rangeFromAdd} </p>
                                </div>
                            }
                            {isSuccessMutRm &&
                                <div>
                                    <p className='successText'> <CheckIcon size={30} color="var(--success-color)" /> Successfully removed IP range: {rangeFromAdd} </p>
                                </div>
                            }
                            {wrongFormat &&
                                <div>
                                    <p className='successText'> <CrossIcon size={30} color="var(--error-color)" /> IP range already excists </p>

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
