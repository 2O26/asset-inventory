import React from 'react';
import './CronMap.css'; // Make sure to create the CronMap.css file with the styles

const CronMap = () => {
    return (
        <table className="cron-table">
            <thead>
                <tr>
                    <th></th>
                    <th>second</th>
                    <th>minute</th>
                    <th>hour</th>
                    <th>day of month</th>
                    <th>month</th>
                    <th>day of week</th>
                    <th>year</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Required</td>
                    <td>No</td>
                    <td>Yes</td>
                    <td>Yes</td>
                    <td>Yes</td>
                    <td>Yes</td>
                    <td>Yes</td>
                    <td>No</td>
                </tr>
                <tr>
                    <td>Values Range</td>
                    <td>0-59</td>
                    <td>0-59</td>
                    <td>0-23</td>
                    <td>1-31</td>
                    <td>1-12</td>
                    <td>0-7</td>
                    <td>1970-3000</td>
                </tr>
                <tr>
                    <td>Flags</td>
                    <td>, - *</td>
                    <td>, - *</td>
                    <td>, - *</td>
                    <td>, - * / ? L W</td>
                    <td>, - *</td>
                    <td>, - * / ? L #</td>
                    <td>, - * /</td>
                </tr>
                <tr>
                    <td>Alias</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>jan-dec</td>
                    <td>sun-sat</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    );
};

export default CronMap;
