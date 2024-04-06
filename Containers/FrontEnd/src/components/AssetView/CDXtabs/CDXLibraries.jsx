import React, { useState } from 'react';
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

export const CDXLibraries = (components) => {

    const [visibilityStates, setVisibilityStates] = useState(
        components.data.reduce((acc, component, index) => {
            acc[index] = false; // Initially, all components are not visible
            return acc;
        }, {})
    );
    const toggleVisibility = (section) => {
        setVisibilityStates(prevState => ({
            ...prevState,
            [section]: !prevState[section]
        }));
    };

    return (
        <div>
            <div>
                <div>
                    <h1>Library list</h1>
                </div>
                <hr />

                <hr />
                <div lassName='center-flex-column'>
                    <h2> SEARCHBAR PLACEHOLDER</h2>
                    {components.data
                        .filter(component => component.type === "library")
                        .map((component, index) => (
                            <div key={index}>
                                <div
                                    className={visibilityStates[index] ? "settings-header show-content" : "settings-header"}
                                    onClick={() => toggleVisibility(index)}
                                    style={{ cursor: 'pointer' }}>
                                    <strong>{component.name}</strong>
                                    <button className='arrow-container'>
                                        {visibilityStates[index] ? <i className="arrow down"></i> : <i className="arrow up"></i>}
                                    </button>
                                </div>
                                {visibilityStates[index] && (
                                    <div className='settings-container'>
                                        <p> Name: {component.name} </p>
                                        <p> Version: {component.version} </p>
                                        <p> Description: {component.description} </p>
                                        <p> Purl: {component.purl} </p>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
                <hr />
            </div>
        </div>
    );
};
