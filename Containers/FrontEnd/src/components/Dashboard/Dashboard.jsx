import React, { useState, useEffect } from 'react'
import './Dashboard.css'
import { dashboardTools } from '../Tools/Tools.jsx'
import { GetUserSettings } from '../Services/ApiService.js';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner.jsx';

export default function Dashboard() {

    const { data: userSettingData, isLoading: isLoadingUserSettings, isError: isUserSettings, error: errorUserSettings } = useQuery({
        queryKey: ['User Settings'],
        queryFn: GetUserSettings,
        enabled: true
    });

    const [combinedTools, setCombinedTools] = useState([]);

    useEffect(() => {
        if (userSettingData) {
            const leftLst = userSettingData.userSettings[0].leftDash
            const rightLst = userSettingData.userSettings[0].rightDash
            const maxKey = Math.max(
                ...Object.values(leftLst),
                ...Object.values(rightLst).filter(value => value !== 0)
            );

            const newCombined = [];

            for (let i = 1; i <= maxKey; i++) {
                const leftTool = Object.keys(leftLst).find(key => leftLst[key] === i) || null;
                const rightTool = Object.keys(rightLst).find(key => rightLst[key] === i) || null;

                // fix so that if left tool is empty, the right tool will take its place
                if (leftTool) {
                    newCombined.push({ leftTool, rightTool });
                } else if (!leftTool && rightTool) {
                    newCombined.push({ "leftTool": rightTool, "rightTool": leftTool });
                }
            }

            setCombinedTools(newCombined);
        }
    }, [userSettingData]);

    if (isLoadingUserSettings) return <LoadingSpinner />;
    if (isUserSettings) return <div className='errorMessage'>{errorUserSettings.message}</div>;

    return (
        <div className='dashboard-container'>
            {combinedTools.map((item, index) => (
                <div key={index} className="container-50-height">
                    <div className="dashboard-tool-container-75">
                        <h3 className='item-header-ds'>
                            {dashboardTools({ size: 24 })[item.leftTool]?.icon} {item.leftTool}
                        </h3>
                        <div className="tool-component">
                            {dashboardTools()[item.leftTool].component}
                        </div>
                    </div>
                    {item.rightTool ?
                        <div className="dashboard-tool-container-25">
                            <h3 className='item-header-ds'>
                                {dashboardTools({ size: 24 })[item.rightTool]?.icon} {item.rightTool}
                            </h3>
                            <div className="tool-component">
                                {dashboardTools()[item.rightTool].component}
                            </div>
                        </div>
                        : null}
                </div>
            ))}
        </div>
    )
}
