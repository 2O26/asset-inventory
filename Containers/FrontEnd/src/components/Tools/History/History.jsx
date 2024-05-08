import React, { useEffect } from 'react'
import { JSONTree } from 'react-json-tree';
import { useQuery } from '@tanstack/react-query';
import { GetHistory } from '../../Services/ApiService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';

import './History.css'

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

export default function History({ width, height, isDashboard = false, isAssetView = false, assetID = null }) {

    const { data: historyData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['getHistory'],
        queryFn: () => GetHistory(assetID),
        enabled: true
    });

    useEffect(() => {
        refetch()
    }, [assetID])

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <div className='errorMessage'> {error.message}</div>;
    if (isAssetView && !historyData) return <div className='asset-info-container'> <div className='errorMessage'> This asset has no hisotry</div></div>;
    if (!historyData) return <div className='errorMessage'> No history</div>;
    let divName = 'history-container'
    if (isAssetView) {
        divName = 'asset-info-container'
    } else if (isDashboard) {
        divName = 'page-container'
    }

    return (
        <div className={divName} style={{ width: width, height: height }}>
            <div className={isDashboard ? "history-content-dashboard" : "history-content"}>
                {Object.values(historyData).map((value, index) => {
                    const date = new Date(value.timestamp)
                    const formattedDate = date.toLocaleString(countryCode, options);
                    return (
                        <div key={index}>
                            <h2 style={{ marginBottom: "1rem" }}>{formattedDate}</h2>
                            {
                                Object.entries(value.change).map(([key, val], index) => {
                                    return (
                                        val && (
                                            <div key={index} style={{ marginLeft: "3rem" }}>
                                                <h3>{key}</h3>
                                                <JSONTree data={val} theme={theme} hideRoot />
                                            </div>

                                        )
                                    )
                                })
                            }
                        </div>
                    )
                })
                }
            </div>
        </div>
    )
}
