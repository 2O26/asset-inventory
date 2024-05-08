import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from "@tanstack/react-query";

import { UpdateAPIOSSkey, GetOSSAPIkey, CheckAPIOSSkey } from '../../Services/ApiService';

import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";
import "./CVEScannerSettings.css";
import { CheckIcon, CrossIcon } from '../../common/Icons/Icons';

export default function CVEScanSettings() {
    const [apiCredentials, setApiCredentials] = useState({ apikey: "", username: "" });
    const [wrongFormat, setWrongFormat] = useState(false);

    const { mutate: mutateAdd, isPending: isPendingMutAdd, isError: isErrorMutAdd, isSuccess: isSuccessMutAdd } = useMutation({
        mutationFn: UpdateAPIOSSkey, // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            if (data.success === "success") {
                refetchAPIkey();
                console.log("API key added sucessfully:", data);
            }
            else {
                console.log("Could not add API key. Error: ", data.success);
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("Add API key error: ", error);
        }
    });

    const { mutate: mutateCheck, isPending: isPendingCheck, isSuccess: isSuccessCheck, isError: isErrorCheck, error: errorCheck } = useMutation({
        mutationFn: CheckAPIOSSkey, // Directly pass the LogIn function
        onError: (error) => {
            console.error("API key check error: ", error);
        }
    });

    const { data: apiData, isLoading: isLoading, isError: isErrorKey, error: keyerror, refetch: refetchAPIkey } = useQuery({
        queryKey: ['API key'],
        queryFn: GetOSSAPIkey,
        enabled: true
    });

    const addAPIkey = (event) => {
        event.preventDefault();
        if (apiCredentials.username == "" && apiCredentials.apikey == "") {
            mutateAdd("")
        } else {
            mutateAdd(btoa(`${apiCredentials.username}:${apiCredentials.apikey}`));
        }
    }

    const handleChangeKey = (event) => {
        const { value } = event.target;
        // Regular expression to match only alphanumeric characters
        setWrongFormat(false)
        if (/^[a-zA-Z0-9]+$/.test(value) || value === "") {
            setApiCredentials(prevCredentials => ({ ...prevCredentials, apikey: value }));
        } else {
            setWrongFormat(true)
        }
    };
    const handleChangeUsername = (event) => {
        const { value } = event.target;
        setApiCredentials(prevCredentials => ({ ...prevCredentials, username: value }));
    };

    const handleCheck = () => {
        if (apiCredentials.apikey && apiCredentials.username) {
            console.log("check 1")
            mutateCheck(btoa(`${apiCredentials.username}:${apiCredentials.apikey}`))
        } else {
            window.alert("Please fill in username and api token")
        }
    }

    useEffect(() => {
        if (apiData?.apikey) {
            const tokenParts = atob(apiData.apikey).split(':')
            setApiCredentials({ username: tokenParts[0], apikey: tokenParts[1] })
        }
    }, [apiData])

    if (isLoading) {
        return (
            <div >
                <LoadingSpinner />
            </div>
        )
    }

    if (isErrorKey) {
        return (
            <div >
                <p> Error, {keyerror}</p>
            </div>
        )
    }


    // { isErrorMutRm && <div className='errorMessage'>{errorMutRm.message}</div> }
    // { isErrorMutAdd && <div className='errorMessage'>{errorMutAdd.message}</div> }

    return (
        <form onSubmit={addAPIkey} style={{ width: "80%" }}>
            <h3 style={{ margin: "1rem 0" }}> Sonatype OSS index key </h3>
            <div className='form-group'>

                <label > API Token:</label>
                <p style={{ wordBreak: "break-word", width: "30vw", textAlign: "left" }}>{apiData?.apikey}</p>
            </div>

            <div className='form-group'>
                <label>Username:</label>
                <input
                    type="username"
                    id="username"
                    name="username"
                    value={apiCredentials.username} // Set the value of the input to the state
                    onChange={handleChangeUsername} // Update the state when the input changes
                >
                </input>
            </div>
            <div className='form-group'>
                <label>Api Key:</label>
                <input
                    type="API key"
                    id="OSSAPIKEY"
                    name="OSSAPIKEY"
                    value={apiCredentials.apikey} // Set the value of the input to the state
                    onChange={handleChangeKey} // Update the state when the input changes
                >
                </input>
            </div>
            <div>

                {isPendingMutAdd && <LoadingSpinner />}
                {isSuccessMutAdd &&
                    <div>
                        <p className='successText'> <CheckIcon size={30} color="var(--success-color)" /> Successfully updated API key </p>
                    </div>
                }
                {isErrorMutAdd &&
                    <div>
                        <p className='successText'> <CrossIcon size={30} color="var(--error-color)" /> Failed to update API key. </p>
                    </div>
                }
                {wrongFormat &&
                    <div>
                        <p className='errorMessage'> Input only accepts letters and numbers</p>
                    </div>

                }
                {isPendingCheck && <LoadingSpinner />}

                {isSuccessCheck &&
                    <div>
                        <p className='successText'> <CheckIcon size={30} color="var(--success-color)" /> Token is authenticated! </p>
                    </div>
                }
                {isErrorCheck &&
                    <div>
                        <p className='successText'> <CrossIcon size={30} color="var(--error-color)" /> {errorCheck.message} </p>
                    </div>
                }
            </div>

            <div className='buttonContainerNetScan'>
                <button className='standard-button' type="submit">
                    <div> Save </div>
                </button>
                <button className='standard-button' type="button" onClick={() => handleCheck()}>
                    <div> Check Connection</div>
                </button>
            </div>
        </form>
    )
}


