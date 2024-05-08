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

export const CDXFramework = (components) => {
    return (
        <div className='cdx-tabs'>
            <div >
                <h1 style={{ marginBottom: "2rem" }}>List of frameworks used in software</h1>
                {components.data
                    .filter(component => component.type === "framework")
                    .map((component, index) => (
                        <li key={index}>
                            <strong>{component.name}</strong> - Type: {component.type}
                        </li>
                    ))}
            </div>
        </div>
    );
};
