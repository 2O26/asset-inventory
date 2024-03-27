import { Handle, Position } from 'reactflow';
import { ActiveIcon, AlertIcon, ApplicationIcon, ClusterIcon, ComputerIcon, IoTIcon, LaptopIcon, OfflineIcon, ServerIcon, SwitchIcon } from './NodeIcons';

const iconTypeMap = {
    "Server": <ServerIcon />, "Switch": <SwitchIcon />, "PC": <ComputerIcon />, "Cluster": <ClusterIcon />, "Application": <ApplicationIcon />, "IoT": <IoTIcon />,
    "Laptop": <LaptopIcon />
}

const statusMap = { "alert": <AlertIcon />, "active": <ActiveIcon />, "offline": <OfflineIcon /> }


export const CustomNodeComponent = ({ data }) => {
    return (
        <>
            <div className="cloud gradient">
                <div>
                    {iconTypeMap[data.type]}
                </div>
            </div>
            {/* <div className={`${data.selected && "selected-view"} wrapper gradient `}> */}
            <div className={`wrapper gradient `}>
                <div className="inner">
                    <div className="body">
                        {/* {data.status && statusMap[data.status]} */}
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