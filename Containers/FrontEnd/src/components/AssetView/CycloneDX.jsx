import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query';
import { CycloneDXuploader } from './CycloneDXuploader';
import './CycloneDX.css'
import { CycloneDXIcon } from '../common/Icons/Icons';
import Modal from 'react-modal';
import { GetCDXfiles } from '../Services/ApiService';
import { JSONTree } from 'react-json-tree';

export default function CycloneDX({ assetID }) {
    const [selectedView, setSelectedView] = useState('FullFile');

    const { data: cycloneData, isLoading: loadingCyclone, isError: isErrorCyclone, error: cycloneError, refetch: refetchCyclone } = useQuery({
        queryKey: ['getCDXfiles', assetID],
        queryFn: () => GetCDXfiles(assetID),
        enabled: true
    });

    const [fileFocus, setFileFocus] = useState('');
    const [open, setOpen] = useState(false);

    const handleClick = (cycloneData) => {
        setFileFocus(cycloneData)
        console.log("file:", fileFocus)
        console.log(cycloneData);
        setOpen(true)
    }

    const handleButtonClick = (view) => {
        setSelectedView(view);
    }

    return (
        <div className='asset-info-container' >
            <CycloneDXuploader assetID={assetID} />
            <hr />
            {cycloneData &&
                <div >
                    <h3>Files</h3>
                    <div className='cxdFileList'>
                        <div className='cdxFile' onClick={() => handleClick(cycloneData)}>
                            <CycloneDXIcon />
                            <div className='cdxFileTest'>Uploaded SBOM file</div>
                        </div>
                    </div>
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
                        <div className="button-container">
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
                                Metadata
                            </button>
                            <button
                                className={`tab-button ${selectedView === 'Libraries' ? 'active-button' : ''}`}
                                onClick={() => handleButtonClick('Libraries')}
                            >
                                Libraries
                            </button>
                            <button
                                className={`tab-button ${selectedView === 'Frameworks' ? 'active-button' : ''}`}
                                onClick={() => handleButtonClick('Frameworks')}
                            >
                                Frameworks
                            </button>
                            <button
                                className={`tab-button ${selectedView === 'CycloneDx' ? 'active-button' : ''}`}
                                onClick={() => handleButtonClick('CycloneDx')}
                            >
                                C-DX
                            </button>
                        </div>
                        <div>
                            {selectedView === 'FullFile' && (
                                <div>
                                    <JSONTree data={fileFocus} theme="greenscreen" invertTheme />
                                </div>
                            )
                            }
                            {selectedView === 'Metadata' && (
                                <div>
                                    <JSONTree data={fileFocus["metadata"]} theme="greenscreen" invertTheme />
                                </div>
                            )
                            }
                            {selectedView === 'Libraries' && (
                                <div>

                                </div>
                            )
                            }
                            {selectedView === 'Frameworks' && (<p> third</p>)
                            }
                            {selectedView === 'CycloneDx' && (<p>class</p>)
                            }
                        </div>
                    </div>
                }
            </Modal>
        </div>
    )
}
