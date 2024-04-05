import React, { useState, useEffect } from 'react'
import './Dashboard.css'
import { dashboardTools } from '../Tools/Tools.jsx'
import { SaveUserSetting, GetUserSettings } from '../Services/ApiService.js';
import { useMutation, useQuery } from '@tanstack/react-query';

export default function Dashboard() {
    const [tools25by50, setTools25by50] = useState(["Asset List", "Graph View", "Asset List"]);
    const [tools75by50, setTools75by50] = useState(["Graph View", "Asset List", "Graph View"]);

    const { mutate, isPending, isError, error } = useMutation({
        mutationFn: SaveUserSetting,
        onSuccess: (data) => {
            // window.alert("Settings Saved")
            refetchUserSettings();
        },
        onError: (error) => {
            console.error("Save Dashboard Config: ", error);
        }
    });

    const { data: userSettingData, isLoading: isLoadingUserSettings, isError: isUserSettings, error: errorUserSettings, refetch: refetchUserSettings } = useQuery({
        queryKey: ['User Settings'],
        queryFn: GetUserSettings,
        enabled: true
    });

    useEffect(() => {
        if (userSettingData) {
            setTools25by50(userSettingData.userSettings[0].rightDash);
            setTools75by50(userSettingData.userSettings[0].leftDash);
        }
    }, [userSettingData])

    return (
        <div className='dashboard-container' >
            <div className='container-75-50'>
                {tools75by50.map((key, index) => (
                    <div key={index} className='item-75-50'>
                        <h3 className='item-header-ds'>{dashboardTools({ size: 24 })[key].icon} {key} </h3>
                        {dashboardTools({ width: "68vw", height: "60vh" })[key].component}
                    </div>
                ))}
            </div>
            <div className='container-25-50'>
                {tools25by50.map((key, index) => (
                    <div key={index} className='item-25-50'>
                        <h3 className='item-header-ds' >{dashboardTools({ size: 24 })[key].icon} {key} </h3>
                        {dashboardTools({ width: "26vw", height: "60vh" })[key].component}
                    </div>
                ))}
            </div>
        </div>
    )
}
