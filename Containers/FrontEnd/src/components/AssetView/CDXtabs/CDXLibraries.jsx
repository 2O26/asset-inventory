import React, { useState, useEffect } from 'react';
import './CDXdata.css';
import { JSONTree } from 'react-json-tree';
import { SearchIcon } from '../../common/Icons/Icons';

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

export function SearchBar({ onSearch }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleInputChange = (event) => {
        const term = event.target.value;
        setSearchTerm(term);
        onSearch(term);
    };

    return (
        <div className="SearchBar">
            <div className="searchIconWrapper">
                <SearchIcon size={30} />
            </div>
            <div className="inputWrapper">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    placeholder="Search..."
                />
            </div>
        </div>
    );
}

export const CDXLibraries = (components) => {

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredAssets, setFilteredAssets] = useState([]);
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

    // Dynamically adjust based on viewport width
    const width = "95vw", height = "100%";
    const matches = width.match(/\d+/);
    const numberPart = parseInt(matches[0], 10)
    const isNarrowView = numberPart < 60; // Example breakpoint

    useEffect(() => {
        if (components.data) {

            const newFilteredComponents = searchTerm === '' ? components.data :
                components.data.filter(component => {
                    // Assuming 'name' and 'description' are searchable fields.
                    // You can add more fields to check as needed.

                    // Search both by name or by description
                    return component.type === "library" &&
                        (component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            component.description.toLowerCase().includes(searchTerm.toLowerCase()));
                });

            setFilteredAssets(newFilteredComponents);
        }
    }, [components, searchTerm]);

    return (
        <div>
            <div>
                <div>
                    <h1>Library list</h1>
                </div>
                <hr />

                <hr />
                <div className='center-flex-column'>
                    <SearchBar onSearch={setSearchTerm} />
                    {filteredAssets.map((component, index) => (
                        <div key={index} className="json-tree-container">
                            <div
                                className={visibilityStates[index] ? "drop-down-header show-content" : "drop-down-header"}
                                onClick={() => toggleVisibility(index)}
                                style={{ cursor: 'pointer' }}>
                                <strong>{component.name} @ {component.version} </strong>
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
