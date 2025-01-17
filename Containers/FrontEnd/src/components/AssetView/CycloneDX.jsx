import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query';
import { CycloneDXuploader } from './CycloneDXuploader';
import './CycloneDX.css'
import { CycloneDXIcon, RemoveIcon } from '../common/Icons/Icons';
import Modal from 'react-modal';
import { GetCDXfiles, RemoveCDXfile, RemoveLibsGivenSBOMRemoval } from '../Services/ApiService';
import { JSONTree } from 'react-json-tree';
import { CDXMetadata } from './CDXtabs/CDXMetadata';
import { CDXLibraries } from './CDXtabs/CDXLibraries';
import { CDXFramework } from './CDXtabs/CDXFramework';
import { CDXCVE } from './CDXtabs/CDXCVE';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';


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

export default function CycloneDX({ assetID }) {
    const [selectedView, setSelectedView] = useState('FullFile');

    const { data: cycloneData, isLoading: loadingCyclone, isError: isErrorCyclone, error: cycloneError, refetch: refetchCyclone } = useQuery({
        queryKey: ['getCDXfiles', assetID],
        queryFn: () => GetCDXfiles(assetID),
        enabled: true
    });

    const { mutate: removeSBOMfilemutate, isPending: isPendingSBOMremoval, error: removeSBOMError } = useMutation({
        mutationFn: () => RemoveCDXfile(assetID), // Directly pass the LogIn function
        onSuccess: () => {
            refetchCyclone()
        },
        onError: (error) => {
            refetchCyclone()
            console.error("Remove CDX file error:", error.message);
        }
    });

    const { mutate: removeLibsmutate, isPending: isPendingLibRemoval, error: removeLibError } = useMutation({
        mutationFn: () => RemoveLibsGivenSBOMRemoval(assetID), // Directly pass the LogIn function
        onSuccess: () => {
            refetchCyclone()
        },
        onError: (error) => {
            refetchCyclone()
            console.error("Remove CDX file error:", error.message);
        }
    });

    const [fileFocus, setFileFocus] = useState('');
    const [open, setOpen] = useState(false);

    const handleClick = (cycloneData) => {
        setFileFocus(cycloneData)
        setOpen(true)
    }

    const handleButtonClick = (view) => {
        setSelectedView(view);
    }

    const handleRemove = () => {
        if (window.confirm("Are you sure you want to remove this Cyclone DX file?")) {
            removeSBOMfilemutate(assetID);
            removeLibsmutate(assetID);
        }
    }

    return (
        <div className='asset-info-container' >
            <CycloneDXuploader assetID={assetID} />
            <hr />
            {loadingCyclone && <LoadingSpinner />}
            {(cycloneData && !cycloneData.error) &&
                <div >
                    <h3>Files</h3>
                    <div className='cxdFileList'>
                        <div className='cdxFile' onClick={() => handleClick(cycloneData)}>
                            <CycloneDXIcon />
                            <div className='cdxFileTest'>Uploaded SBOM file</div>
                        </div>
                        <div onClick={() => handleRemove()}>
                            <RemoveIcon color={"var(--error-color)"} />
                        </div>
                    </div>
                    {isPendingSBOMremoval && <LoadingSpinner />}
                    {removeSBOMError && <div className='errorMessage'>{removeSBOMError.message}</div>}
                </div>
            }
            <Modal
                isOpen={open}
                ariaHideApp={false}
                contentLabel="CDX File"
                overlayClassName="reactModalOverlay"
                className="reactModalContent"
                shouldCloseOnOverlayClick={true}
                onRequestClose={() => setOpen(false)}
            >
                {fileFocus.length != 0 &&
                    <div className='CDXModal'>
                        <div className="button-container-json">
                            <button
                                className={`tab-button ${selectedView === 'FullFile' ? 'active-button' : ''}`}
                                onClick={() => handleButtonClick('FullFile')}
                            >
                                Full CycloneDX File
                            </button>
                            <button
                                className={`tab-button ${selectedView === 'Metadata' ? 'active-button' : ''}`}
                                onClick={() => handleButtonClick('Metadata')}
                            >
                                Metadata about software
                            </button>
                            <button
                                className={`tab-button ${selectedView === 'Libraries' ? 'active-button' : ''}`}
                                onClick={() => handleButtonClick('Libraries')}
                            >
                                External Libraries Used
                            </button>
                            <button
                                className={`tab-button ${selectedView === 'Frameworks' ? 'active-button' : ''}`}
                                onClick={() => handleButtonClick('Frameworks')}
                            >
                                External Frameworks Used
                            </button>
                            <button
                                className={`tab-button ${selectedView === 'VulnerbleComponents' ? 'active-button' : ''}`}
                                onClick={() => handleButtonClick('VulnerbleComponents')}
                            >
                                Vulnerble Components
                            </button>
                        </div>
                        <div className='json-container'>
                            {selectedView === 'FullFile' && (
                                <div className='json-tree-container'>
                                    <JSONTree data={fileFocus} theme={theme} hideRoot />
                                </div>
                            )}
                            {selectedView === 'Metadata' && (
                                <div className='json-tree-container'>
                                    <CDXMetadata data={fileFocus["metadata"]} />
                                </div>
                            )}
                            {selectedView === 'Libraries' && (
                                <div className='json-tree-container'>
                                    <CDXLibraries data={fileFocus.components} />
                                </div>
                            )}
                            {selectedView === 'Frameworks' && (
                                <div className='json-tree-container'>
                                    <CDXFramework data={fileFocus.components} />
                                </div>
                            )}
                            {selectedView === 'VulnerbleComponents' && (
                                <div className='json-tree-container'>
                                    <CDXCVE assetID={assetID} />
                                </div>
                            )}
                        </div>
                    </div>
                }
            </Modal>
        </div>
    )
}
