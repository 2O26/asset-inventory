import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { UploadCycloneDX } from '../Services/ApiService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { FileUploader } from 'react-drag-drop-files';
import './CycloneDXuploader.css';

export const CycloneDXuploader = ({ assetID }) => {
    const { mutate: mutateAdd, isPending: isPendingMutAdd, isError: isErrorMutAdd, error: errorMutAdd } = useMutation({
        mutationFn: UploadCycloneDX,
        onSuccess: (data) => {
            console.log(data);
        },
        onError: (error) => {
            console.error("Upload CycloneDX error: ", error);
        }
    });

    const handleFileChange = (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('assetID', assetID);

        mutateAdd(formData);
    };

    if (isPendingMutAdd) return <LoadingSpinner />;
    if (isErrorMutAdd) return <div className='errorMessage'>{errorMutAdd.message}</div>;

    return (
        <div>
            <h3>Upload CycloneDX File</h3>
            <div className="container">
                <FileUploader
                    handleChange={handleFileChange}
                    name="file"
                    types={['JSON']}
                    className="custom-file-uploader" />
            </div>
            <p>Drag and drop your file here or click to select a file.</p>
            <p style={{ marginTop: "0.5rem" }}>Supported formats: JSON</p>
        </div>
    );
};
