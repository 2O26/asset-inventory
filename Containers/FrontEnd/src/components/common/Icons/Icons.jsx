import React from 'react'
import './Icons.css'
import { FaUserCircle, FaTools } from 'react-icons/fa'
import { FaGear } from "react-icons/fa6";
import { MdDashboard } from "react-icons/md";
import { PiSignInBold, PiSignOutBold, PiShareNetwork } from "react-icons/pi";
import { CiBoxList, CiBarcode } from "react-icons/ci";
import { CgDarkMode } from "react-icons/cg";
import { SiElastic } from "react-icons/si";
import { GrGraphQl } from "react-icons/gr";
import { IoIosRemoveCircle, IoIosAddCircle, IoIosInformationCircleOutline } from "react-icons/io";
import { CgArrowsH } from "react-icons/cg";
import { CiCircleCheck, CiCircleRemove } from "react-icons/ci";
import { MdAddLink } from "react-icons/md";
import { CiSearch } from "react-icons/ci";
import { IoIosArrowForward } from "react-icons/io";
import { IoIosArrowBack } from "react-icons/io";
import { MdCyclone } from "react-icons/md";
import { BsFiletypePdf } from "react-icons/bs";
import { MdOutlineAdminPanelSettings } from "react-icons/md";



// get icons from HERE: https://react-icons.github.io/react-icons/

export const AdminConsoleIcon = ({ size = 30 }) => {
    return (
        <MdOutlineAdminPanelSettings size={size} />
    )
}

export const CycloneDXIcon = ({ size = 30 }) => {
    return (
        <MdCyclone size={size} />
    )
}

export const LeftArrow = ({ size = 30 }) => {
    return (
        <IoIosArrowBack size={size} />
    )
}

export const RightArrow = ({ size = 30 }) => {
    return (
        <IoIosArrowForward size={size} />
    )
}

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

export const SearchIcon = ({ size = 30 }) => {
    return (
        <CiSearch size={size} />
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

export const GraphIcon = ({ size = 30 }) => {
    return (
        <GrGraphQl size={size} />
    )
}

export const PDFIcon = ({ size = 30 }) => {
    return (
        <BsFiletypePdf size={size} />
    )
}

export const InfoIcon = ({ size = 30, component: Component, text = null }) => {
    return (
        <div class="info-container">
            <IoIosInformationCircleOutline size={size} />
            {Component && <div class="info-component"> <Component />  </div>}
            {text && <div class="info-text">  {text}  </div>}
        </div>
    )
}

export const RemoveIcon = ({ size = 30, color = null }) => {
    return (
        <IoIosRemoveCircle size={size} color={color} />
    )
}
export const AddIcon = ({ size = 30, color = null }) => {
    return (
        <IoIosAddCircle size={size} color={color} />
    )
}

export const ConnectionIcon = ({ size = 30, color = null }) => {
    return (
        <CgArrowsH size={size} color={color} />
    )
}
export const CheckIcon = ({ size = 30, color = null }) => {
    return (
        <CiCircleCheck size={size} color={color} />
    )
}
export const CrossIcon = ({ size = 30, color = null }) => {
    return (
        <CiCircleRemove size={size} color={color} />
    )
}
export const LinkAddIcon = ({ size = 30, color = null }) => {
    return (
        <MdAddLink size={size} color={color} />
    )
}