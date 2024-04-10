import React, { useState, useEffect } from 'react';
import './CDXdata.css';
import { JSONTree } from 'react-json-tree';
import { useQuery, useMutation } from '@tanstack/react-query';
import { GetVulnerbleComponents } from '../../Services/ApiService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import { StatusIcon } from '../../common/Icons/Icons';
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

            // const newFilteredComponents = searchTerm === '' ? components.data :
            //     components.data.filter(component => {
            //         // Assuming 'name' and 'description' are searchable fields.
            //         // You can add more fields to check as needed.
            //         return component.type === "library" &&
            //             (component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            //                 component.description.toLowerCase().includes(searchTerm.toLowerCase()));
            //     });
            if (CVEData.cycloneDXvulns) {
                setFilteredfilteredLibraries(CVEData.cycloneDXvulns.npm);
            }

        }
    }, [CVEData, searchTerm]);

    function handleClick() {
        console.log(CVEData.cycloneDXvulns.npm.vulnerabilities)
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
                <h3> NPM vulnerbilities</h3>
                {filteredLibraries.vulnerabilities && (
                    <div className='center-flex-column'>
                        {Object.keys(filteredLibraries.vulnerabilities).map((key, index) => {
                            const sevScale = { "critical": "#FF0000", "high": "#FFA500", "moderate": "#FFEA00", "low": "0F0" }
                            const severity = filteredLibraries.vulnerabilities[key].severity;
                            return (
                                <div key={index} className='json-tree-container'>
                                    <div
                                        className={visibilityStates[index] ? "drop-down-header show-content" : "drop-down-header"}
                                        onClick={() => toggleVisibility(index)}
                                        style={{ cursor: 'pointer' }}>
                                        {/* Assuming the 'name' property exists within the vulnerability details object */}
                                        <StatusIcon size={15} color={sevScale[severity]} />
                                        <strong>{filteredLibraries.vulnerabilities[key].name}</strong>
                                        <button className='arrow-container'>
                                            {visibilityStates[index] ? <i className="arrow down"></i> : <i className="arrow up"></i>}
                                        </button>
                                    </div>
                                    {visibilityStates[index] && (
                                        <div className='settings-container'>
                                            {/* Here 'key' is used directly, as it is the unique identifier of the vulnerability */}
                                            <p> Name: {filteredLibraries.vulnerabilities[key].name} </p>
                                            {/* Accessing the 'severity' property from the vulnerability details object */}
                                            <p> Severity: {severity} </p>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                <hr />
            </div>
        </div>
    );
};
