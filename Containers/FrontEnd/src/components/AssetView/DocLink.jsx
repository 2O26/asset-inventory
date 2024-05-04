import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { GetDocLink, SetDocLink } from '../Services/ApiService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import './DocLink.css';

export default function DocLink({ assetID }) {
    const [inputLink, setInputLink] = useState('');
    
    const { data: docLinkData, isLoading: getLinkLoading, isError: getLinkIsError, error: getLinkError, refetch: refetchGetLink } = useQuery({
        queryKey: ['get-doc-link',assetID],
        queryFn: () => GetDocLink(assetID),
        enabled: true
    });

    const { mutate: setLink, isPending: isPendingSetLink } = useMutation({
        mutationFn: SetDocLink, 
        onSuccess: () => {
            window.alert("Succesfully added doc link");
            setInputLink(''); // Empty the input field
            refetchGetLink();
        },
        onError: (error) => {
            window.alert("Set doc link error: ", error.message);
        }
    });

    useEffect(() => {
    }, [docLinkData]);

    const handleSetLink = async (event) => {
        event.preventDefault();
        let linkToSet = inputLink;
        if (!inputLink.startsWith("http://") && !inputLink.startsWith("https://")) {
            linkToSet = "https://" + inputLink;
        }
        setLink({ link: linkToSet, assetID });
    };
    

    const handleOpenLink = () => {
        window.open(docLinkData, "_blank"); // Open link in new tab
    };

    return (
        <div className="asset-info-container">
            <div>
                {getLinkLoading && <LoadingSpinner />}
                {getLinkIsError && <div className='errorMessage'>{getLinkError.message}</div>}
                <form onSubmit={handleSetLink}>
                    <input
                        type='text'
                        value={inputLink}
                        onChange={(e) => setInputLink(e.target.value)}
                        placeholder='Enter documentation link...'
                        className="InputField"
                    />
                    <div className="doclink-button-container">
                        <button className="standard-button" type="submit" disabled={isPendingSetLink}>Set Link</button>
                    </div>
                </form>
                {isPendingSetLink && <LoadingSpinner />}
                {docLinkData ? (
                    <div className="doclink-button-container">
                        <div>Link connected to asset: <a href={docLinkData}>{docLinkData}</a></div>
                        <button className="standard-button" onClick={handleOpenLink}>Open Link</button>
                    </div>
                ) : (
                    <div>There is no connected documentation link to this asset</div>
                )}
            </div>
        </div>
    );
}
