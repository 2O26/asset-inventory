import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from "@tanstack/react-query";

import { AddAPIOSSkey, GetOSSAPIkey } from '../../Services/ApiService';

import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";

export default function CVEScanSettings() {
    const [apikey, setapikey] = useState({});

    const { mutate: mutateAdd, isPending: isPendingMutAdd, isError: isErrorMutAdd, error: errorMutAdd } = useMutation({
        mutationFn: () => AddAPIOSSkey(apikey), // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            if (data.success === "success") {
                refetchAPIkey();
                console.log("API key added sucessfully:", data);
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
    const { data: apiData, isLoading: isLoading, isError: isErrorKey, error: keyerror, refetch: refetchAPIkey } = useQuery({
        queryKey: ['API key'],
        queryFn: GetOSSAPIkey,
        enabled: true
    });

    useEffect(() => {
        if (apiData) {
            setapikey(apiData.apikey)
        }
    }, [apiData]);

    // if (!recurringData || !Array.isArray(recurringData.recurring) || recurringData.recurring === null) {
    //     // TODO : return error
    //     return <div>No recurring data available.</div>;
    // }

    // if (!ipRangesData || !Array.isArray(ipRangesData.ipranges) || ipRangesData.ipranges === null) {
    //     // TODO : return error
    //     return <div>No IP range data available.</div>;
    // }

    return (
        <div >
            <LoadingSpinner />
        </div>
    )
}


