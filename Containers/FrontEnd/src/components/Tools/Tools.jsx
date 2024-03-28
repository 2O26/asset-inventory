import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Tools.css';
import { AssetListIcon, IpScannerIcon, LogsIcon, GraphIcon } from '../common/Icons/Icons';
import { RedirectToLogServer } from './ViewLogs/ViewLogs.jsx';

export default function Tools() {
    const navigate = useNavigate();

    return (
        <div className='tools-container'>
            {/* View tools */}
            <div className="view-tools">
                <div className="tools-header">View Tools</div>
                <div className="view-tool-objects">
                    <button className='button-tool' onClick={() => navigate("/tools/asset-list")}>
                        <AssetListIcon size={60} />
                        <div> Asset List</div>
                    </button>
                    <button className='button-tool' onClick={() => RedirectToLogServer()}>
                        <LogsIcon size={60} />
                        <div> View Logs</div>
                    </button>
                    <button className='button-tool' onClick={() => navigate("/tools/graph-view")}>
                        <GraphIcon size={60} />
                        <div> Graph View</div>
                    </button>
                </div>
            </div>
            <div className="vertical-line"></div>
            {/* Scan tools */}
            <div className="scan-tools">
                <div className="tools-header">Scan Tools</div>
                <div className="scan-tool-objects">
                    <button className='button-tool' onClick={() => navigate("/tools/network-scan")}>
                        <IpScannerIcon size={55} />
                        <div> Network Scanner</div>
                    </button>
                    {/* <button className='button-tool' onClick={() => navigate("/tools/mac-scan")}>
                        <MacScannerIcon size={65} />
                        <div> Mac Scanner</div>
                    </button> */}
                </div>
            </div>
        </div>
    );
}
