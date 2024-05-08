import React from 'react';
import './CDXdata.css';
import { JSONTree } from 'react-json-tree';

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

export const CDXMetadata = (metadata) => {
    return (
        <div className='cdx-tabs'>
            <div>
                <div className='meta-base-info'>
                    <h1>Base information about the software: {metadata.data.component.name}</h1>
                    <div className='meta-base-info-child'>
                        <h4>Name:</h4>
                        <p>{metadata.data.component.name}</p>
                    </div>
                    <div className='meta-base-info-child'>
                        <h4>Type:</h4>
                        <p>{metadata.data.component.type}</p>

                    </div>
                    <div className='meta-base-info-child'>
                        <h4>Version:</h4>
                        <p>{metadata.data.component.version}</p>
                    </div>
                    <hr />
                </div>
                <div className='json-tree-container'>
                    <h3>Raw JSON fields related to metadata in CycloneDXfile</h3>
                    <JSONTree data={metadata} theme={theme} hideRoot />
                </div>
            </div>
        </div>
    );
};
