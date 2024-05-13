import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from "@tanstack/react-query";
import { GetDocLink, SetDocLink } from '../Services/ApiService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';

export default function DocLink({ assetID }) {
    const [inputLink, setInputLink] = useState('');

    const { data: docLinkData, isLoading: getLinkLoading, isError: getLinkIsError, error: getLinkError, refetch: refetchGetLink } = useQuery({
        queryKey: ['get-doc-link', assetID],
        queryFn: () => GetDocLink(assetID),
        enabled: true
    });

    const { mutate: setLink, isPending: isPendingSetLink } = useMutation({
        mutationFn: SetDocLink,
        onSuccess: () => {
            window.alert("Successfully updated doc link");
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

    const handleRemoveLink = () => {
        setLink({ link: "", assetID }); // Set doc link to an empty string
    };

    return (
        <div className="asset-info-container">
            <div>
            {docLinkData !== null && docLinkData !== undefined ? (
            <div>
                <div>Link connected to asset: <a onClick={handleOpenLink} style={{ color: "var(--button-hover)", cursor: "pointer" }}>{docLinkData}</a></div>
                <div className="standard-button-container">
                    <button className="standard-button" onClick={handleOpenLink}>Open Link</button>
                </div>
            </div>
        ) : (
            <div style={{ marginBottom: "1rem" }}>There is no connected documentation link to this asset</div>
        )}
                <form onSubmit={handleSetLink}>
                    <div className='inputContainer'>
                        <input
                            type='text'
                            value={inputLink}
                            onChange={(e) => setInputLink(e.target.value)}
                            placeholder='Enter documentation link...'
                            className="inputFields"
                            required
                        />
                    </div>
                    <div className="standard-button-container">
                        <button className="standard-button" type="submit" disabled={isPendingSetLink}>{docLinkData ? "Update" : "Set Link"}</button>
                    </div>
                </form>
                <div className="standard-button-container">
                    <button className="standard-button" onClick={handleRemoveLink} disabled={!docLinkData}>Remove Link</button>
                </div>
                {getLinkLoading && <LoadingSpinner />}
                {getLinkIsError && <div className='errorMessage'>{getLinkError.message}</div>}
                {isPendingSetLink && <LoadingSpinner />}
            </div>
        </div>
    );
}