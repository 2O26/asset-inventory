import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UploadCycloneDX } from '../Services/ApiService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { FileUploader } from 'react-drag-drop-files';
import './CycloneDXuploader.css';

export const CycloneDXuploader = ({ assetID }) => {

    const queryClient = useQueryClient();
    const supportedFileTypes = ['JSON', 'XML']

    const { mutate: mutateAdd, isPending: isPendingMutAdd, isError: isErrorMutAdd, error: errorMutAdd } = useMutation({
        mutationFn: UploadCycloneDX,
        onSuccess: (data) => {
            console.log(data);
            queryClient.invalidateQueries(['getCDXfiles']);
        },
        onError: (error) => {
            console.error("Upload CycloneDX error: ", error);
        }
    });

    const handleFileChange = (file) => {
        if (window.confirm(`Are you sure you want to upload the file ${file.name}`)) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('assetID', assetID);
            mutateAdd(formData);
        }


    };

    if (isPendingMutAdd) return <div className="bomSpinner" >Validating <div style={{ width: "4rem" }}><LoadingSpinner /></div></div>
    if (isErrorMutAdd) return <div className='errorMessage'>{errorMutAdd.message}</div>;

    return (
        <div>
            <h3 style={{ marginBottom: "1rem" }}>Upload CycloneDX File</h3>
            <p>Drag and drop your file here or click to select a file.</p>
            <p style={{ marginTop: "0.5rem" }}>Supported formats: {supportedFileTypes.join(", ")}</p>
            <div className="container">
                <FileUploader
                    handleChange={handleFileChange}
                    name="file"
                    types={supportedFileTypes}
                    className="custom-file-uploader" />
            </div>
            <p>NOTE: Uploading a new file will overwrite an already existing file.</p>
        </div>
    );
};
