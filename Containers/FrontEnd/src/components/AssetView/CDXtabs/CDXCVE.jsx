import React from 'react';
import './CDXdata.css';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GetVulnerbleComponents } from '../../Services/ApiService';

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

export const CDXCVE = (assetID) => {

    const { data: CVEData, isLoading: loadingCVE, isError: isErrorCVE, error: CVEError, refetch: refetchCVE } = useQuery({
        queryKey: ['CVEVulnerabilities', assetID],
        queryFn: () => GetVulnerbleComponents(assetID),
        enabled: true
    });

    function handleClick() {
        console.log(CVEData);
        refetchCVE();
    }

    return (
        <div>
            <div>
                <h1> Hello world</h1>
                <hr />
                <button onClick={handleClick} className='standard-button'> test </button>
            </div>
        </div>
    );
};
