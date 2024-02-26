import React from 'react'
import { FaUserCircle, FaTools } from 'react-icons/fa'
import { FaGear } from "react-icons/fa6";
import { MdDashboard } from "react-icons/md";
import { PiSignInBold, PiSignOutBold, PiShareNetwork } from "react-icons/pi";
import { CiBoxList, CiBarcode } from "react-icons/ci";
import { CgDarkMode } from "react-icons/cg";
import { SiElastic } from "react-icons/si";

// get icons from HERE: https://react-icons.github.io/react-icons/


export const ThemeIcon = ({ size = 30 }) => {
    return (
        <CgDarkMode size={size} />
    )
}

export const MacScannerIcon = ({ size = 30 }) => {
    return (
        <CiBarcode size={size} />
    )
}

export const IpScannerIcon = ({ size = 30 }) => {
    return (
        <PiShareNetwork size={size} />
    )
}

export const AssetListIcon = ({ size = 30 }) => {
    return (
        <CiBoxList size={size} />
    )
}

export const LogInIcon = ({ size = 30 }) => {
    return (
        <PiSignInBold size={size} />
    )
}

export const LogOutIcon = ({ size = 30 }) => {
    return (
        <PiSignOutBold size={size} />
    )
}

export const UserIcon = ({ size = 30 }) => {
    return (
        <FaUserCircle size={size} />
    )
}

export const ToolsIcon = ({ size = 30 }) => {
    return (
        <FaTools size={size} />
    )
}

export const DashboardIcon = ({ size = 30 }) => {
    return (
        <MdDashboard size={size} />
    )
}

export const SettingsIcon = ({ size = 30 }) => {
    return (
        <FaGear size={size} />
    )
}

export const LogsIcon = ({ size = 30 }) => {
    return (
        <SiElastic size={size} />
    );
};