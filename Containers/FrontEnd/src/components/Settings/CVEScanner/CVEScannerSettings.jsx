import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from "@tanstack/react-query";

import { } from '../../Services/ApiService';

import LoadingSpinner from "../../common/LoadingSpinner/LoadingSpinner";

export default function CVEScanSettings() {

    // const { mutate: mutateRm, isPending: isPendingMutRm, isError: isErrorMutRm, error: errorMutRm } = useMutation({
    //     mutationFn: RmRecurring, // Directly pass the LogIn function
    //     onSuccess: (data) => {
    //         // Handle success logic here, no need for useEffect
    //         if (data.success === "success") {
    //             // setReoccuringFromAdd(data.recurring); // If I want to use the data
    //             setRecurringFail(false);
    //             setRecurringSuccess(false);
    //             refetchRecurring();
    //             // console.log("IP range added sucessfully:", data);
    //         }
    //         else {
    //             setRecurringSuccess(false);
    //             console.log("Could not add IP range sucessfully. Error: ", data.success);
    //         }
    //     },
    //     onError: (error) => {
    //         // Optionally handle error state
    //         console.error("SetNetworkScanSettings error: ", error);
    //     }
    // });

    // const { data: recurringData, isLoading: isLoadingRecurring, isError: isErrorRecurring, error: errorRecurring, refetch: refetchRecurring } = useQuery({
    //     queryKey: ['Recurring'],
    //     queryFn: GetRecurring,
    //     enabled: true
    // });
    // useEffect(() => {
    //     if (ipRangesData && Array.isArray(ipRangesData.ipranges)) {
    //         setIprange(ipRangesData.ipranges[0]);
    //     }
    //     try {
    //         const humanReadable = cronstrue.toString(timeinterval);
    //         setReadableExpression(humanReadable);
    //     } catch (error) {
    //         console.error("Error parsing cron expression", error);
    //         setReadableExpression("Invalid cron expression");
    //     }
    // }, [ipRangesData, timeinterval]);

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


