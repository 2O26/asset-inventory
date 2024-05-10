import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query';
import { GetAllSBOMLibraries, RecheckVulnerbleComponentsAll } from '../../Services/ApiService';
import "./SBOMLibrarySearch.css";
import { CheckIcon, ReloadIcon, SearchIcon, StatusIcon } from '../../common/Icons/Icons';
import { GetState } from '../../Services/ApiService';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

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

export default function SBOMLibrarySearch({ isDashboard = false }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredLibraries, setFilteredLibraries] = useState([]);
    const [visibilityStates, setVisibilityStates] = useState({});
    const [onlyVulnerable, setOnlyVulnerable] = useState(false);
    const [vulnerableCVECount, setVulnerableCVECount] = useState(0);
    const navigate = useNavigate();

    const { data: stateData } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: true
    });

    const { data: libraryData, isLoading: libraryLoading, isError: isErrorLibrary, error: libraryError, refetch: refetchLibraries } = useQuery({
        queryKey: ['SBOM libraries'],
        queryFn: GetAllSBOMLibraries,
        enabled: true
    });

    const { mutate, isPending, isSuccess: isSuccessMut, reset } = useMutation({
        mutationFn: RecheckVulnerbleComponentsAll,
        onSuccess: () => {
            refetchLibraries()
        },
        onError: (error) => {
            window.alert("There was an error scanning the Libraries:", error.message)
        }

    })

    const toggleVisibility = (section) => {
        setVisibilityStates(prevState => ({
            ...prevState,
            [section]: !prevState[section]
        }));
    };

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

    const scanLibraries = () => {
        reset()
        mutate()
    }

    useEffect(() => {
        if (libraryData && libraryData.libraries) {
            let count = 0; // Initialize a counter for vulnerable components
            const newFilteredComponents = libraryData.libraries.filter(component => {
                const matchesSearch = searchTerm === '' || component.name.toLowerCase().includes(searchTerm.toLowerCase());

                // Check if the component is vulnerable
                const hasVulnerability = component.CVE && component.CVE[0];
                if (hasVulnerability) {
                    count++;
                }
                if (onlyVulnerable) {
                    return hasVulnerability && matchesSearch;
                } else {
                    return matchesSearch;
                }
            });
            setFilteredLibraries(newFilteredComponents);
            setVulnerableCVECount(count); // Update the state with the count of vulnerable components
        }
    }, [libraryData, searchTerm, onlyVulnerable]);

    if (libraryLoading) {
        return (
            <div>
                <div>
                    Waiting for CVE scan of SBOM libraries... This might take up to 1 min.
                </div>
                <LoadingSpinner />
            </div>
        )
    }
    if (isErrorLibrary) {
        return (
            <div>
                Error loading data: {libraryError.message}. Could not fetch the libraries?
            </div>)
    }

    return (
        <div className='page-container'>
            <div className="SBOM-container" style={{ width: (!isDashboard && "50vw") }}>
                {!isDashboard && <h1 style={{ color: "var(--text-color)", marginTop: "1rem 0" }}>Global library search</h1>}
                <div>
                    {/* <hr /> */}
                    <div className='SBOM-search-container'>
                        <div className='SBOM-top-row'>
                            <p className='vulncount'>Vulnerable libraries: {vulnerableCVECount}</p>
                            <SearchBar onSearch={setSearchTerm} />
                            <div className='SBOM-mid-row'>
                                <label className='range-checkbox-label' style={{ marginRight: "auto", marginTop: "0.5rem" }}>
                                    <p className='text-desc'>Show only vulnerable libraries</p>
                                    <input
                                        type="checkbox"
                                        value="all"
                                        checked={onlyVulnerable}
                                        onChange={() => setOnlyVulnerable(!onlyVulnerable)}
                                    />
                                </label>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <p className="scan-lib-container text-desc" style={{ width: "16rem" }}>Scan Libraries {isPending ? <div style={{ width: "3rem", height: "3rem" }}><LoadingSpinner /></div> : <div style={{ width: "3rem", height: "3rem" }} onClick={() => scanLibraries()}><ReloadIcon /></div>}</p>
                                    {isSuccessMut && <div className='scan-lib-container text-desc'>Libraries Scanned<CheckIcon color={'var(--success-color)'} /></div>}
                                </div>
                            </div>
                        </div>
                        {filteredLibraries && (
                            <div className='center-flex-column'>
                                {Object.entries(filteredLibraries).map(([key, library], index) => {
                                    return (
                                        <div key={index} className='json-tree-container'>
                                            <div
                                                className={visibilityStates[index] ? "drop-down-header show-content" : "drop-down-header"}
                                                onClick={() => toggleVisibility(index)}
                                                style={{ cursor: 'pointer' }}>
                                                <div />
                                                <strong>{library.name} @ {library.version}</strong>
                                                <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                                                    {library.CVE[0] && (
                                                        <div style={{ marginRight: "0.2rem" }}>
                                                            <StatusIcon size={15} color={getColor(library.CVE[0].cvssScore)} />
                                                        </div>
                                                    )}
                                                    <button className='arrow-container'>
                                                        {visibilityStates[index] ? <i className="arrow down"></i> : <i className="arrow up"></i>}
                                                    </button>
                                                </div>
                                            </div>
                                            {visibilityStates[index] && (
                                                <div className='dropdown-container'>
                                                    <p> Library name: {library.name} </p>
                                                    <p> Purl: {library.purl} </p>
                                                    <p> Version: {library.version} </p>
                                                    <p> Library exists in the SBOM files for the following assets: </p>
                                                    <div className='cve-asset-container' >
                                                        {library.assetids.map((id, idx) => (
                                                            (stateData.state.assets[id]) &&
                                                            <div key={idx} className='cve-asset-item' onClick={() => navigate(`/asset-view/${id}`)}>
                                                                <p>Name: {stateData?.state?.assets && stateData.state.assets[id]?.properties.Name}</p>
                                                                <p>ID: {id}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {library.CVE[0] && (
                                                        <div >
                                                            <p>CVE: {library.CVE[0].cve}</p>
                                                            <p>CVE score: {library.CVE[0].cvssScore}</p>
                                                            <p>Description: {library.CVE[0].description}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                            }
                                        </div>
                                    )
                                })}

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    )
}


