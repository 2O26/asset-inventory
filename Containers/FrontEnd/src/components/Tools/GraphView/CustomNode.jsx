import { Handle, Position } from 'reactflow';
import { useCallback } from 'react';
import { FiCloud } from 'react-icons/fi';
import { ActiveIcon, AlertIcon, ApplicationIcon, ClusterIcon, ComputerIcon, OfflineIcon, ServerIcon, SwitchIcon } from './NodeIcons';

const iconTypeMap = {
    "Server": <ServerIcon />, "Switch": <SwitchIcon />, "Computer": <ComputerIcon />, "Cluster": <ClusterIcon />, "Application": <ApplicationIcon />
}

const statusMap = { "alert": <AlertIcon />, "active": <ActiveIcon />, "offline": <OfflineIcon /> }


export const CustomNodeComponent = ({ data }) => {
    console.log(data)

    return (
        <>
            <div className="cloud gradient">
                <div>
                    {iconTypeMap[data.type]}
                </div>
            </div>
            <div className="wrapper gradient">
                <div className="inner">
                    <div className="body">
                        {data.status && statusMap[data.status]}
                        <div>
                            <div className="title">{data.label}</div>
                            {data.type && <div className="subline">{data.type}</div>}
                        </div>
                    </div>
                    <Handle type="target" position={Position.Left} />
                    <Handle type="source" position={Position.Right} />
                </div>
            </div>
        </>
    );
};