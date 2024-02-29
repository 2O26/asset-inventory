import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Tools.css'
import { AssetListIcon, IpScannerIcon, MacScannerIcon, LogsIcon } from '../common/Icons/Icons';
import {RedirectToLogServer} from './ViewLogs/ViewLogs.jsx';

export default function Tools() {

    const navigate = useNavigate();

    return (
        <div className='tools-container'>
            <button className='button-tool' onClick={() => navigate("/tools/asset-list")}>
                <AssetListIcon size={60} />
                <div> Asset List</div>
            </button>
            <button className='button-tool' onClick={() => navigate("/tools")}>
                <IpScannerIcon size={55} />
                <div> IP Scanner</div>
            </button>
            <button className='button-tool' onClick={() => navigate("/tools")}>
                <MacScannerIcon size={65} />
                <div> Mac Scanner</div>
            </button>
            <button className='button-tool' onClick={() => RedirectToLogServer()}>
                <LogsIcon size={60} />
                <div> View Logs</div>
            </button>
        
        </div>
    );
}
