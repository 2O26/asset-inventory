import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from "@tanstack/react-query";
import { GetDocLink, SetDocLink } from '../Services/ApiService';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';

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
            console.log("Doclink.jsx 1: ", docLinkData);
            window.alert("Succesfully added doc link");
            refetchGetLink()
        },
        onError: (error) => {
            window.alert("Set doc link error: ", error.message);
        }
    });

    useEffect(() => {
        console.log("DocLink.jsx useEffect 1: ", docLinkData);
    }, [docLinkData]);

    const handleSetLink = async (event) => {
        event.preventDefault();
        setLink({ link: inputLink, assetID });
        console.log("DocLink.jsx 2", inputLink, assetID);
     }     

    return(
        <div>
            {getLinkLoading && <LoadingSpinner />}
                {
            docLinkData?.docLink ? <div> Link connected to asset:   
            {docLinkData.docLink } </div>
                :
            <div> There is no connected documentation link to this asset </div>
            }
            {getLinkIsError && <div className='errorMessage'>{getLinkError.message}
            </div>}
            <form onSubmit={handleSetLink}>
                <input
                    type='text'
                    value={inputLink}
                    onChange={(e) => setInputLink(e.target.value)}
                    placeholder='Enter documentation link...'
                    style={{ marginRight: '1rem' }}
                />
                <button type="submit" disabled={isPendingSetLink }>Set Link</button>
            </form>
            {isPendingSetLink && <LoadingSpinner />}
        </div>
    )
}
