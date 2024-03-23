import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UploadCycloneDX } from '../Services/ApiService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';

export const CycloneDXuploader = ({ data, assetID, title, showPluginInfo }) => {
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileSelect = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const { mutate: mutateAdd, isPending: isPendingMutAdd, isError: isErrorMutAdd, error: errorMutAdd } = useMutation({
        mutationFn: UploadCycloneDX, // Directly pass the LogIn function
        onSuccess: (data) => {
            console.log(data);
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("Upload CycloneDX error: ", error);
        }
    });

    const handleUpload = async () => {
        if (!selectedFile) {
            alert('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('assetID', assetID);

        // TODO: specify what asset it is attached to

        // Adjust the URL to your upload endpoint
        mutateAdd(formData);
    };

    if (isPendingMutAdd) return <LoadingSpinner />
    if (isErrorMutAdd) return <div className='errorMessage'>{errorMutAdd.message}</div>

    return (
        <div>
            <h1>Upload CycloneDX file</h1>
            <input type="file" onChange={handleFileSelect} />
            <button onClick={handleUpload}>Upload File</button>
        </div >
    )
}
