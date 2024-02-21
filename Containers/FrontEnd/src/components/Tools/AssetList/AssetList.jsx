import React, { useState } from 'react'
import './AssetList.css'
import { useNavigate } from 'react-router-dom';
import AddAsset from '../../AddAsset/AddAsset';

const jsonData = {
    "General Info": {
        "Save Date": "12:55 01 Feb 2024",
        "Plugin List": [
            "Ip Scan",
            "Mac Scan",
            "OS Scan",
            "CVE Scan"
        ]
    },
    "Asset List": {
        "ID_4123523": {
            "Relation ID": [
                1
            ],
            "Standard": {
                "Name": "PC A",
                "Type": "Desktop",
                "Criticality": 1,
                "Owner": "Joe B",
                "Date Created": "2024-02-01 15:21",
                "Date Modified": "2024-02-03 12:36",
            },
            "Plugin": {
                "Ip Scan": {
                    "IP": "192.168.1.1",
                    "Sub Network": "192.168.1.0/24"
                },
                "Mac Scan": {
                    "Mac Address": "1D9:4C3:53f:Af5"
                },
                "OS Scan": {
                    "OS": "Windows",
                    "Version": 11.4,
                    "Version Release Date": "01 Jan 2024"
                },
                "CVE Scan": {
                    "Vulnerability Score": 2,
                    "CVE List": [
                        "CVE-2016-12434",
                        "CVE-2016-43434"
                    ]
                }
            }
        },
        "ID_578439485": {
            "Relation ID": [
                2
            ],
            "Standard": {
                "Name": "PC B",
                "Type": "Desktop",
                "Criticality": 1,
                "Owner": "Jimmy J",
                "Date Created": "2024-02-14 15:26",
                "Date Modified": "2024-02-18 13:32",

            },
            "Plugin": {
                "Ip Scan": {
                    "IP": "192.168.1.2",
                    "Sub Network": "192.168.1.0/24"
                },
                "Mac Scan": {
                    "Mac Address": "2D9:4B3:53C:Af5"
                },
                "OS Scan": {
                    "OS": "Windows",
                    "Version": 11.4,
                    "Version Release Date": "01 Jan 2024"
                },
                "CVE Scan": {
                    "Vulnerability Score": 2,
                    "CVE List": [
                        "CVE-2016-12434",
                        "CVE-2016-43434"
                    ]
                },
                "Other Scan": {
                    "Scan List": [
                        "Test 1",
                        "Test 2",
                        "Test 3",
                        "Test 4",
                    ]
                }
            }
        },
        "ID_9823482": {
            "Relation ID": [
                1,
                2
            ],
            "Standard": {
                "Name": "Server A",
                "Type": "Web server",
                "Criticality": 4,
                "Owner": "Jesper K",
                "Date Created": "2024-01-01 12:32",
                "Date Modified": "2024-01-01 12:32",

            },
            "Plugin": {
                "Ip Scan": {
                    "IP": "192.10.1.1",
                    "Sub Network": "192.10.1.0/24"
                },
                "Mac Scan": {
                    "Mac Address": "1D9:4C3:53f:Af5"
                },
                "OS Scan": {
                    "OS": "Ubuntu",
                    "Version": 22.04,
                    "Version Release Date": "10 Dec 2023"
                },
                "CVE Scan": {
                    "Vulnerability Score": 4,
                    "CVE List": [
                        "CVE-2017-12434",
                        "CVE-2017-43434"
                    ]
                }
            }
        }
    },
    "Relation Map": [
        {
            "ID": 1,
            "Type": "Ethernet",
            "Direction": "One Way",
            "Relation": [
                "ID_9823482",
                "ID_4123523"
            ]
        },
        {
            "ID": 2,
            "Type": "Ethernet",
            "Direction": "Both Way",
            "Relation": [
                "ID_9823482",
                "ID_578439485"
            ]
        }
    ]
}

const getColumnHeaders = (data) => {

    const columnHeaders = new Set(); // Using a Set to ensure uniqueness of headers

    // Loop through each asset to extract keys from standard and plugin information
    Object.values(data['Asset List']).forEach(asset => {
        // Extract standard keys
        Object.keys(asset.Standard).forEach(key => columnHeaders.add(key));

        // Extract plugin keys
        // Object.values(asset.Plugin).forEach(plugin => {
        //     Object.keys(plugin).forEach(key => columnHeaders.add(key));
        // });
    });

    return Array.from(columnHeaders); // Convert Set back to an array
};

export default function AssetList() {
    const navigate = useNavigate()
    const [data, setData] = useState(jsonData)
    const columnHeaders = getColumnHeaders(data);

    const handleClick = (asset) => {
        navigate(`/asset-view`, { state: asset });
    }


    return (
        <div className='page-container'>
            <div className='asset-list-container'>
                <div className='headerRow'>
                    {columnHeaders.map(header => (
                        <div key={header} className='headerCell'>
                            {header}
                        </div>
                    ))}
                </div>

                <hr style={{ margin: "0.5rem 2rem ", border: "1px solid var(--text-color)" }}></hr>

                {/* Asset information */}
                {Object.values(data['Asset List']).map((asset, assetIndex) => (
                    <div key={assetIndex} className='assetRow' onClick={() => handleClick(asset)}>
                        {columnHeaders.map((header, headerIndex) => {
                            // Attempt to find a value from either Standard or Plugin that matches the header
                            const standardValue = asset.Standard[header];
                            // const pluginValue = asset.Plugin && Object.values(asset.Plugin).find(plugin => plugin[header]);

                            // Determine what to display: a value from Standard, Plugin, or an empty string
                            // const valueToDisplay = standardValue || (pluginValue && pluginValue[header]) || '';
                            const valueToDisplay = standardValue;

                            return (
                                <div key={headerIndex} className='assetCell'>
                                    {valueToDisplay}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <AddAsset setPrevData={setData} />
        </div>
    );
};
