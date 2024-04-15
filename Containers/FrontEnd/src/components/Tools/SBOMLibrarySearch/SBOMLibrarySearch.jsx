import React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query';
import { GetAllSBOMLibraries } from '../../Services/ApiService';
import "./SBOMLibrarySearch.css";

export default function SBOMLibrarySearch() {
    const { data: libraryData, isLoading: libraryCVE, isError: isErrorLibrary, error: libraryError, refetch: refetchLibraries } = useQuery({
        queryKey: ['SBOM libraries'],
        queryFn: GetAllSBOMLibraries,
        enabled: true
    });

    function handleClick() {
        if (libraryData) {
            console.log(libraryData.libraries)
        }
    }

    return (
        <div>
            <h3 style={{ color: "var(--text-color)", marginTop: "4rem" }}>Global library search</h3>
            <button className='standard-button' onClick={() => handleClick()}> Console all libraries</button>
        </div>
    )
}


