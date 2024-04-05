import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query';
import { CycloneDXuploader } from './CycloneDXuploader';
import './CycloneDX.css'
import { CycloneDXIcon } from '../common/Icons/Icons';
import Modal from 'react-modal';
import { GetCDXfiles } from '../Services/ApiService';

export default function CycloneDX({ assetID }) {
    // const data = { "File1": { "data": "wassa" }, "File2": { "data": "yolo" } }

    //OBS!! ändra så att data är det som hämtas från useQuery ist!!!!!

    const { data: cycloneData, isLoading: loadingCyclone, isError: isErrorCyclone, error: cycloneError, refetch: refetchCyclone } = useQuery({
        queryKey: ['getCDXfiles', assetID],
        queryFn: () => GetCDXfiles(assetID),
        enabled: true
    });

    const [fileFocus, setFileFocus] = useState('');
    const [open, setOpen] = useState(false);

    const handleClick = (key) => {
        setFileFocus(key)
        console.log("fliel:", fileFocus, " : ", cycloneData[key])
        setOpen(true)
    }
    return (
        <div className='asset-info-container' >
            <CycloneDXuploader assetID={assetID} />
            <hr />
            {cycloneData &&
                <div >
                    <h3>Files</h3>
                    <div className='cxdFileList'>
                        {Object.entries(cycloneData).map(([key, value], index) => (
                            // <div className='cdxFile' key={index} onClick={() => { setOpen(true), setFileFocus(key) }}>
                            <div className='cdxFile' key={index} onClick={() => handleClick(key)}>
                                <CycloneDXIcon />
                                <div className='cdxFileTest'>{key}</div>
                                {/* <div>{key}</div> */}
                            </div>
                        ))}
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
                        {fileFocus}
                        {Object.entries(cycloneData[fileFocus]).map(([key, value], index) => (
                            <div key={index}>
                                {key}: {value}
                            </div>
                        ))}

                    </div>
                }
            </Modal>
        </div>
    )
}
