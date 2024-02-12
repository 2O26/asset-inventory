import React from 'react'
import './AssetList.css'
import { useNavigate } from 'react-router-dom';

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
                "Criticality": 1
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
                "Criticality": 4
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

const getColumnHeaders = (jsonData) => {
    const columnHeaders = new Set(); // Using a Set to ensure uniqueness of headers

    // Loop through each asset to extract keys from standard and plugin information
    Object.values(jsonData['Asset List']).forEach(asset => {
        // Extract standard keys
        Object.keys(asset.Standard).forEach(key => columnHeaders.add(key));

        // Extract plugin keys
        Object.values(asset.Plugin).forEach(plugin => {
            Object.keys(plugin).forEach(key => columnHeaders.add(key));
        });
    });

    return Array.from(columnHeaders); // Convert Set back to an array
};

export default function AssetList() {
    const navigate = useNavigate()
    const columnHeaders = getColumnHeaders(jsonData);
    const wassa = "yolo"

    const handleClick = (asset) => {
        return (e) => {
            e.preventDefault();
            navigate(`/asset-view`, { state: asset });
        }
    }


    return (
        <div className='page-container'>
            <div className='asset-list-container'>
                {/* Column headers */}
                <div className='headerRow'>
                    {columnHeaders.map(header => (
                        <div key={header} className='headerCell'>
                            {header}
                        </div>
                    ))}
                </div>

                <hr style={{ margin: "0.5rem 2rem ", border: "1px solid var(--text-color)" }}></hr>

                {/* Asset information */}
                {Object.values(jsonData['Asset List']).map(asset => (
                    <div key={asset.Standard.Name} className='assetRow' onClick={handleClick(asset)}>
                        {/* Standard information */}
                        {Object.values(asset.Standard).map((value, index) => (
                            <div key={index} className='assetCell'>
                                {value}
                            </div>
                        ))}

                        {/* Plugin information */}
                        {Object.values(asset.Plugin).map(plugin => (
                            <React.Fragment key={Object.keys(plugin)[0]}>
                                {Object.values(plugin).map((value, index) => (
                                    <div key={index} className='assetCell'>
                                        {value}
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
