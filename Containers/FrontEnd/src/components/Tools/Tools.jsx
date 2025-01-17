import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Tools.css';

import { AssetListIcon, IpScannerIcon, LogsIcon, GraphIcon, PDFIcon, AdminConsoleIcon, SBOMSearch, HistoryIcon } from '../common/Icons/Icons';
import { RedirectToLogServer } from './ViewLogs/ViewLogs.jsx';

import RenderOnRole from '../ProtectedRoutes/RenderOnRole.jsx';

import IssueBoard from './IssueBoard/IssueBoard';

import AssetList from './AssetList/AssetList.jsx';
import GraphView from './GraphView/GraphView.jsx';
import History from './History/History.jsx';
import SBOMLibrarySearch from './SBOMLibrarySearch/SBOMLibrarySearch.jsx';

export const dashboardTools = ({ size = 60, width = "100%", height = "100%" } = {}) => (
    {
        "Asset List": {
            "icon": <AssetListIcon size={size} />,
            "component": <AssetList width={width} height={height} isDashboard={true} />,
        },
        "Graph View": {
            "icon": <GraphIcon size={size} />,
            "component": <GraphView width={width} height={height} isDashboard={true} />,
        },
        "History": {
            "icon": <HistoryIcon size={size} />,
            "component": <History width={width} height={height} isDashboard={true} />,
        },
        "SBOMSearch": {
            "icon": <SBOMSearch size={size} />,
            "component": <SBOMLibrarySearch width={width} height={height} isDashboard={true} />,
        }
    }
);

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
                        <div className='tool-lable'> Asset List</div>
                    </button>
                    <button className='button-tool' onClick={() => navigate("/tools/graph-view")}>
                        <GraphIcon size={60} />
                        <div className='tool-lable'> Graph View</div>
                    </button>
                    <button className='button-tool' onClick={() => navigate("/tools/history")}>
                        <HistoryIcon size={60} />
                        <div className='tool-lable'> History </div>
                    </button>
                    <button className='button-tool' onClick={() => navigate("/tools/pdf-download")}>
                        <PDFIcon size={60} />
                        <div className='tool-lable'> Download PDF</div>
                    </button>
                    <RenderOnRole roles={['admin']}>
                        <button className='button-tool' onClick={() => RedirectToLogServer()}>
                            <LogsIcon size={60} />
                            <div className='tool-lable'> View Logs</div>
                        </button>
                    </RenderOnRole>
                    <RenderOnRole roles={['admin']}>
                        <button className='button-tool' onClick={() => window.open("http://localhost:8085", "_blank")}>
                            <AdminConsoleIcon size={60} />
                            <div className='tool-lable'> Admin Console</div>
                        </button>
                    </RenderOnRole>
                    <IssueBoard />
                </div>
            </div>
            {/* <div className="vertical-line"></div> */}
            <hr />
            {/* Scan tools */}
            <div className="scan-tools">
                <div className="tools-header">Scan Tools</div>
                <div className="scan-tool-objects">
                    <button className='button-tool' onClick={() => navigate("/tools/network-scan")}>
                        <IpScannerIcon size={55} />
                        <div className='tool-lable'> Network Scanner</div>
                    </button>
                    <button className='button-tool' onClick={() => navigate("/tools/SBOMLibrarySearch")}>
                        <SBOMSearch size={60} />
                        <div className='tool-lable'> Global SBOM library search</div>
                    </button>
                </div>
            </div>
            <hr />
        </div>
    );
}