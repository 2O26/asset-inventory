import React, { useState } from 'react';
import { dashboardTools } from '../../Tools/Tools';
import { SaveDashboardConfig } from '../../Services/ApiService';
import './DashboardSettings.css'
import { useMutation } from '@tanstack/react-query';
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
        mutationFn: SaveDashboardConfig,
        onSuccess: (data) => {
            console.log(data);
            window.alert("Settings Saved")
        },
        onError: (error) => {
            console.error("Save Dashboard Config: ", error);
        }
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
        console.log("left list: ", sortDictByValues(leftLst))
        console.log("right list: ", sortDictByValues(rightLst))
        mutate({ "leftList": sortDictByValues(leftLst), "rightList": sortDictByValues(rightLst) })
    }

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
                <button className="standard-button" disabled={isPending} >Cancel</button>

            </div>
        </div>
    );
}
