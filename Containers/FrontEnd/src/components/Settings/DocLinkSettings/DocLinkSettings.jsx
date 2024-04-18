import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from "@tanstack/react-query";

import { UpdateAPIOSSkey2, GetOSSAPIkey2 } from '../../Services/ApiService';

import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";

export default function CVEScanSettings() {
    const [apikey, setapikey] = useState("");
    const [addAPIKeySuccess, setAddAPIKeySuccess] = useState(false);
    const [addAPIKeyFail, setAddAPIKeyFail] = useState(false);

    const { mutate: mutateAdd, isPending: isPendingMutAdd, isError: isErrorMutAdd, error: errorMutAdd } = useMutation({
        mutationFn: () => UpdateAPIOSSkey2(apikey), // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            if (data.success === "success") {
                refetchAPIkey();
                setAddAPIKeySuccess(true);
                setAddAPIKeyFail(false);
                console.log("API key added sucessfully:", data);
            }
            else {
                setAddAPIKeySuccess(false);
                setAddAPIKeyFail(true);
                console.log("Could not add API key. Error: ", data.success);
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("Add API key error: ", error);
        }
    });

    const { data: apiData, isLoading: isLoading, isError: isErrorKey, error: keyerror, refetch: refetchAPIkey } = useQuery({
        queryKey: ['API key2'],
        queryFn: GetOSSAPIkey2,
        enabled: true
    });

    const addAPIkey = (event) => {
        event.preventDefault();
        mutateAdd(apikey);
        setAddAPIKeyFail(false);
        setAddAPIKeySuccess(false);
    }

    const handleChange = (event) => {
        setapikey(event.target.value);
    };

    useEffect(() => {
        if (apiData) {
            setapikey(apiData.apikey)
        }
    }, [apiData]);

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
        <div >
            <div>
                <h3> Documentation Link: </h3>
            </div>
            <hr />
            <div>
                <form onSubmit={addAPIkey}>
                    <input
                        type="API key"
                        id="OSSAPIKEY"
                        name="OSSAPIKEY"
                        value={apikey} // Set the value of the input to the state
                        onChange={handleChange} // Update the state when the input changes
                        className='api-input'
                    >
                    </input>
                    {isPendingMutAdd && <LoadingSpinner />}
                    {addAPIKeySuccess &&
                        <div>
                            <p className='successText'>Successfully updated Doc Link ✅</p>
                        </div>
                    }
                    {addAPIKeyFail &&
                        <div>
                            <p className='successText'> Failed to update Doc Link. ❌</p>
                        </div>
                    }

                    <div className='buttonContainerNetScan'>
                        <button className='standard-button' type="submit">
                            <div> Update Doc Link </div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}


