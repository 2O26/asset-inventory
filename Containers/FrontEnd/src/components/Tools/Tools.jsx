import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Tools.css';
import { AssetListIcon, IpScannerIcon, LogsIcon, GraphIcon, PDFIcon, AdminConsoleIcon, SBOMSearch } from '../common/Icons/Icons';
import { RedirectToLogServer } from './ViewLogs/ViewLogs.jsx';

import AssetList from './AssetList/AssetList.jsx';
import GraphView from './GraphView/GraphView.jsx';
import PDFDownload from './PDFDownload/PDFDownload.jsx';

import { GetState } from "../Services/ApiService";
import { useQuery } from "@tanstack/react-query"
import RenderOnRole from '../ProtectedRoutes/RenderOnRole.jsx';

export const dashboardTools = ({ size = 60, width = "100%", height = "50vh" } = {}) => (
    {
        "Asset List": {
            "icon": <AssetListIcon size={size} />,
            "component": <AssetList width={width} height={height} isDashboard={true} />,
        },
        "Graph View": {
            "icon": <GraphIcon size={size} />,
            "component": <GraphView width={width} height={height} isDashboard={true} />,
        },
    }
    // TODO: Add global SBOM Library search here
);

export default function Tools() {
    const navigate = useNavigate();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['getState'],
        queryFn: GetState,
        enabled: true
    });

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
                    <button className='button-tool' onClick={() => navigate("/tools/graph-view")}>
                        <GraphIcon size={60} />
                        <div> Graph View</div>
                    </button>
                    <button className='button-tool' onClick={() => navigate("/tools/SBOMLibrarySearch")}>
                        <SBOMSearch size={60} />
                        <div> Global SBOM library search</div>
                    </button>
                    <button className='button-tool' onClick={() => PDFDownload(data.state)}>
                        <PDFIcon size={60} />
                        <div> Download PDF</div>
                    </button>
                    <RenderOnRole roles={['admin']}>
                        <button className='button-tool' onClick={() => RedirectToLogServer()}>
                            <LogsIcon size={60} />
                            <div> View Logs</div>
                        </button>
                    </RenderOnRole>
                    <RenderOnRole roles={['admin']}>
                        <button className='button-tool' onClick={() => window.open("http://localhost:8085", "_blank")}>
                            <AdminConsoleIcon size={60} />
                            <div> Admin Console</div>
                        </button>
                    </RenderOnRole>
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
                        <div> Network Scanner</div>
                    </button>
                    {/* <button className='button-tool' onClick={() => navigate("/tools/mac-scan")}>
                        <MacScannerIcon size={65} />
                        <div> Mac Scanner</div>
                    </button> */}
                </div>
            </div>
            <hr />
        </div>
    );
}
