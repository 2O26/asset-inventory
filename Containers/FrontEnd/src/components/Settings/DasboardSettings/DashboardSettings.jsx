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

function sanitizeList(inputList) {
    const usedValues = new Set();
    const result = {};

    // Iterate over each entry in the input object
    Object.entries(inputList).forEach(([key, value]) => {
        // Allow 0 to be used multiple times
        if (value !== 0) {
            // Check if the non-zero value is already used
            while (usedValues.has(value)) {
                value++;  // Increment the value until it's unique
            }
        }
        // Set the value for the key and add it to the set of used values if not 0
        result[key] = value;
        if (value !== 0) {
            usedValues.add(value);
        }
    });

    return result;
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
        mutate({ update: { "leftDash": sanitizeList(leftLst), "rightDash": sanitizeList(rightLst) } });
        setShowButtons(false)
    }

    const resetInput = () => {
        if (userSettingData) {
            setRightLst(userSettingData.userSettings[0].rightDash);
            setLeftLst(userSettingData.userSettings[0].leftDash);
        }
        setShowButtons(false)
    }

    const updateList = (newData, setFunc) => {
        setFunc(currentState => {
            let updatedState = { ...currentState };
            for (const key in newData) {
                if (newData.hasOwnProperty(key)) {
                    updatedState[key] = newData[key];
                }
            }
            return updatedState;
        });
    };

    useEffect(() => {
        if (userSettingData) {
            updateList(userSettingData.userSettings[0].rightDash, setRightLst);
            updateList(userSettingData.userSettings[0].leftDash, setLeftLst);
        }
    }, [userSettingData])

    return (
        <div className='center-flex-column'>
            <div className='dashboard-settings-container'>
                <div className='pligin-dasb-lst'>
                    <h3>Main</h3>
                    {Object.entries(leftLst).map(([key, value], index) => (
                        <div key={index} className='pligin-list-row'>
                            <div>{key}</div>
                            <input className='input-nr'
                                type="number"
                                value={value}
                                onChange={(e) => handleLeftInputChange(key, e.target.value)}
                                placeholder='0'
                                min={0}
                            />
                        </div>
                    ))}
                </div>
                <div className='pligin-dasb-lst'>
                    <h3>Secondary</h3>
                    {Object.entries(rightLst).map(([key, value], index) => (
                        <div key={index} className='pligin-list-row'>
                            <div>{key}</div>
                            <input className='input-nr'
                                type="number"
                                value={value}
                                onChange={(e) => handleRightInputChange(key, e.target.value)}
                                min={0}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div className='conifg-description'>
                <p>0: will not show</p>
                <p>1+: will display in decending order</p>
                <p style={{ marginTop: "0.6rem" }}>Note: If Main widget has its own row, it will consume the entire width of the dash board. </p>

            </div>
            {isPending && <LoadingSpinner />}
            {isError && <div className='errorMessage'>{error.message}</div>}
            {showButtons &&
                <div className='standard-button-container'>
                    <button className="standard-button" disabled={isPending} onClick={() => handleSave()}>Save</button>
                    <button className="standard-button" disabled={isPending} onClick={() => resetInput()} >Reset</button>

                </div>
            }
        </div>
    );
}
