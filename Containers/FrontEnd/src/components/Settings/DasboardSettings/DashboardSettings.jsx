import React, { useState, useEffect } from 'react';
import { dashboardTools } from '../../Tools/Tools';
import { SaveUserSetting, GetUserSettings } from '../../Services/ApiService';
import './DashboardSettings.css'
import { useMutation, useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';

function sortDictByValues(dict) {
    return Object.entries(dict)
        .filter(([key, value]) => value !== 0)
        .sort((a, b) => a[1] - b[1])
        .map(([key]) => key);
}

export default function DashboardSettings() {
    const [showButtons, setShowButtons] = useState(false);
    const toolsObject = dashboardTools(); // Assuming this returns an object like { "plugin1": {...}, "plugin2": {...} }

    // Initialize leftLst and rightLst as state variables, with each key from toolsObject set to an initial value of 0
    const [leftLst, setLeftLst] = useState(Object.keys(toolsObject).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}));
    const [rightLst, setRightLst] = useState(Object.keys(toolsObject).reduce((acc, key) => ({ ...acc, [key]: 0 }), {}));

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

    function countToolObjectOccurances(array, toolsObject) {
        let counts = {}
        toolsObject.forEach(item => {
            counts[item] = 0
        })
        array.forEach(item => {
            counts[item] += 1;
        })

        return counts;
    }

    // Handler for changing values in leftLst
    const handleLeftInputChange = (key, value) => {
        setShowButtons(true)
        setLeftLst(prev => ({ ...prev, [key]: Number(value) }));
    };

    // Handler for changing values in rightLst
    const handleRightInputChange = (key, value) => {
        setShowButtons(true)
        setRightLst(prev => ({ ...prev, [key]: Number(value) }));
    };

    const handleSave = () => {
        mutate({ update: { "leftDash": sortDictByValues(leftLst), "rightDash": sortDictByValues(rightLst) } });
    }

    const resetInput = () => {
        if (userSettingData) {
            setRightLst(countToolObjectOccurances(userSettingData.userSettings[0].rightDash, Object.keys(toolsObject)));
            setLeftLst(countToolObjectOccurances(userSettingData.userSettings[0].leftDash, Object.keys(toolsObject)));
        }
    }

    useEffect(() => {
        if (userSettingData) {
            setRightLst(countToolObjectOccurances(userSettingData.userSettings[0].rightDash, Object.keys(toolsObject)));
            setLeftLst(countToolObjectOccurances(userSettingData.userSettings[0].leftDash, Object.keys(toolsObject)));
        }
    }, [userSettingData])

    return (
        <div className='center-flex-column '>
            <div className='dashboard-settings-container'>
                <div className='pligin-dasb-lst'>
                    <h3> Left Side 4:1</h3>
                    {Object.entries(leftLst).map(([key, value], index) => (
                        <div key={index} className='pligin-list-row'>
                            <div>{key}</div>
                            <input className='input-nr'
                                type="number"
                                value={value}
                                onChange={(e) => handleLeftInputChange(key, e.target.value)}
                                placeholder='0'
                                min={0}
                                max={Object.keys(leftLst).length}
                            />
                        </div>
                    ))}
                </div>
                <div className='pligin-dasb-lst'>
                    <h3> Right Side 1:3</h3>
                    {Object.entries(rightLst).map(([key, value], index) => (
                        <div key={index} className='pligin-list-row'>
                            <div>{key}</div>
                            <input className='input-nr'
                                type="number"
                                value={value}
                                onChange={(e) => handleRightInputChange(key, e.target.value)}
                                min={0}
                                max={Object.keys(rightLst).length}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {isPending && <LoadingSpinner />}
            {isError && <div className='errorMessage'>{error.message}</div>}
            <div className='standard-button-container'>
                <button className="standard-button" disabled={isPending} onClick={() => handleSave()}>Save</button>
                <button className="standard-button" disabled={isPending} onClick={() => resetInput()} >Reset</button>

            </div>
        </div>
    );
}
