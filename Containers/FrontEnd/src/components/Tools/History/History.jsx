import React from 'react'
import { JSONTree } from 'react-json-tree';
import './History.css'


const historyData =
    [
        {
            "timestamp": "2024-04-15T14:47:20.298Z",
            "changes": {
                "Added Assets": ["46286191946891269", "66286191947891267"],
                "Removed Assets": [],
                "Added Relations": [
                    {
                        "from": "34f8671cfe55e5c76465d840",
                        "to": "45f8671cfe55e5c76465d841"
                    },
                    {
                        "from": "99f8671cfe55e5c76465d840",
                        "to": "77f8671cfe55e5c76465d841"
                    }
                ],
                "Removed Relations": [],
                "Updated Assets": [{
                    "65f8671cfe55e5c76465d843": {
                        "Criticality": { "before": 1, "after": 2 },
                        "Type": {
                            "before":
                                [
                                    "Laptop",
                                    "Windows"
                                ],
                            "after":
                                [
                                    "Laptop",
                                    "MAC"
                                ]
                        }
                    }
                },
                {
                    "53f8671cfe55e5c76465d843": {
                        "Name": { "before": "Server A", "after": "Server B" },
                    }
                }]
            }
        },
        {
            "timestamp": "2023-04-12T15:47:20.298Z",
            "changes": {
                "Added Assets": [],
                "Removed Assets": ["76286191946843269", "99286191947891267"],
                "Added Relations": [],
                "Removed Relations": [
                    {
                        "from": "65f8671cfe55e5c76465d840",
                        "to": "65f8671cfe55e5c76465d841"
                    },
                    {
                        "from": "65f8671cfe55e5c76465d840",
                        "to": "65f8671cfe55e5c76465d841"
                    },

                ],
                "Updated Assets": {
                    "74f8671cfe55e5c76465d843": {
                        "Name": { "before": "Work Laptop", "after": "Martins Laptop" },
                        "Owner": { "before": "UID_6372", "after": "UID_5433" }
                    }
                }
            }
        }
    ]

const theme = {
    base00: 'var(--base-00)',
    base01: 'var(--base-01)',
    base02: 'var(--base-02)',
    base03: 'var(--base-03)',
    base04: 'var(--base-04)',
    base05: 'var(--base-05)',
    base06: 'var(--base-06)',
    base07: 'var(--base-07)',
    base08: 'var(--base-08)',
    base09: 'var(--base-09)',
    base0A: 'var(--base-0A)',
    base0B: 'var(--base-0B)',
    base0C: 'var(--base-0C)',
    base0D: 'var(--base-0D)',
    base0E: 'var(--base-0E)',
    base0F: 'var(--base-0F)',
};

const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false // Swedish standard uses 24-hour clock
};

const countryCode = 'en-SE'

export default function History({ width = "80vw", height = "84vh", isDashboard = false }) {
    return (
        <div className='center-flex-column' style={{ margin: isDashboard ? "0 0" : "1.5rem 0" }}>
            <div className='history-container' style={{ width: width, height: height }}>
                <div className='history-content'>
                    {Object.values(historyData).map((value, index) => {
                        const date = new Date(value.timestamp)
                        const formattedDate = date.toLocaleString(countryCode, options);
                        return (
                            <div key={index}>
                                <h2 style={{ marginBottom: "1rem" }}>{formattedDate}</h2>
                                {
                                    Object.entries(value.changes).map(([key, val], index) => (
                                        val.length != 0 && (
                                            <div key={index} style={{ marginLeft: "3rem" }}>
                                                <h3>{key}</h3>
                                                <JSONTree data={val} theme={theme} hideRoot />
                                            </div>
                                        )
                                    ))
                                }
                            </div>
                        )
                    })

                    }
                </div>
            </div>
        </div >
    )
}
