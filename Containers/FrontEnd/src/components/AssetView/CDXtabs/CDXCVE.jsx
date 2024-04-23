import React, { useState, useEffect } from 'react';
import './CDXdata.css';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GetVulnerbleComponents } from '../../Services/ApiService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import { StatusIcon } from '../../common/Icons/Icons';
import { SearchIcon } from '../../common/Icons/Icons';

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

export const CDXCVE = ({ assetID }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredLibraries, setFilteredfilteredLibraries] = useState([]);
    const [visibilityStates, setVisibilityStates] = useState({});

    const { data: CVEData, isLoading: loadingCVE, isError: isErrorCVE, error: CVEError, refetch: refetchCVE } = useQuery({
        queryKey: ['CVEVulnerabilities', assetID],
        queryFn: () => GetVulnerbleComponents(assetID),
        enabled: true
    });

    const toggleVisibility = (section) => {
        setVisibilityStates(prevState => ({
            ...prevState,
            [section]: !prevState[section]
        }));
    };

    useEffect(() => {
        if (CVEData) {
            if (CVEData.cycloneDXvulns) {
                const newFilteredComponents = searchTerm === '' ? CVEData.cycloneDXvulns :
                    CVEData.cycloneDXvulns.filter(component => {
                        // Assuming 'name' is searchable fields.
                        return (component.name.toLowerCase().includes(searchTerm.toLowerCase()));
                    });
                setFilteredfilteredLibraries(newFilteredComponents);
            }

        }
    }, [CVEData, searchTerm]);

    function consoleVulnerbleLibraries() {
        if (filteredLibraries) {
            console.log(filteredLibraries)
        }
    }

    function getColor(value) {
        // Define start and end colors in RGB
        const startColor = { r: 0, g: 255, b: 0 }; // Green
        const midColor = { r: 255, g: 255, b: 0 }; // Yellow
        const endColor = { r: 255, g: 0, b: 0 };   // Red

        let r, g, b;

        if (value < 5.0) {
            // Scale factor between green and yellow
            let scale = value / 5.0;
            r = startColor.r + (midColor.r - startColor.r) * scale;
            g = startColor.g + (midColor.g - startColor.g) * scale;
            b = startColor.b + (midColor.b - startColor.b) * scale;
        } else {
            // Scale factor between yellow and red
            let scale = (value - 5.0) / 5.0;
            r = midColor.r + (endColor.r - midColor.r) * scale;
            g = midColor.g + (endColor.g - midColor.g) * scale;
            b = midColor.b + (endColor.b - midColor.b) * scale;
        }

        // Convert RGB to Hexadecimal color
        return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }

    if (loadingCVE) {
        return (
            <div>
                <div>
                    Waiting for CVE scan of SBOM libraries... This might take up to 5 min.
                </div>
                <LoadingSpinner />
            </div>
        )
    }
    if (isErrorCVE) {
        return (
            <div>
                Error loading data: {CVEError.message}. Is the SBOM file on the correct format and with valid libraries?
            </div>)
    }
    return (
        <div>
            <div>
                <h3> SBOM library vulnerbilities</h3>
                {filteredLibraries && (
                    <button className='standard-button' onClick={() => consoleVulnerbleLibraries()}> Console vulns for asset</button>
                )}
                <hr />
                <div>
                    <SearchBar onSearch={setSearchTerm} />
                    {filteredLibraries && (
                        <div className='center-flex-column'>
                            {Object.keys(filteredLibraries).map((key, index) => {
                                return (
                                    <div key={index} className='json-tree-container'>
                                        <div
                                            className={visibilityStates[index] ? "drop-down-header show-content" : "drop-down-header"}
                                            onClick={() => toggleVisibility(index)}
                                            style={{ cursor: 'pointer' }}>
                                            {/* Assuming the 'name' property exists within the vulnerability details object */}
                                            <div />
                                            <strong>{filteredLibraries[key].name} @ {filteredLibraries[key].version}</strong>
                                            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                                                <div style={{ marginRight: "0.2rem" }}>
                                                    <StatusIcon size={15} color={getColor(filteredLibraries[key].CVE[0].cvssScore)} />
                                                </div>
                                                <button className='arrow-container'>
                                                    {visibilityStates[index] ? <i className="arrow down"></i> : <i className="arrow up"></i>}
                                                </button>
                                            </div>
                                        </div>
                                        {visibilityStates[index] && (
                                            <div className='settings-container'>
                                                {/* Here 'key' is used directly, as it is the unique identifier of the vulnerability */}
                                                <p> Library name: {filteredLibraries[key].name} </p>
                                                {/* Accessing the 'severity' property from the vulnerability details object */}
                                                <p>CVE: {filteredLibraries[key].CVE[0].cve}</p>
                                                <p>CVE score: {filteredLibraries[key].CVE[0].cvssScore}</p>
                                                <p>Description: {filteredLibraries[key].CVE[0].description}</p>

                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
