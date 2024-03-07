import { CiServer } from "react-icons/ci";
import { HiOutlineSwitchHorizontal } from "react-icons/hi";
import { FaComputer } from "react-icons/fa6";
import { BiLogoKubernetes } from "react-icons/bi";
import { IoLogoAppleAr } from "react-icons/io5";
import { BiError } from "react-icons/bi";
import { RiRadioButtonLine } from "react-icons/ri";

export const ServerIcon = ({ size = 20 }) => {
    return (
        <CiServer size={size} />
    )
}

export const SwitchIcon = ({ size = 18 }) => {
    return (
        <HiOutlineSwitchHorizontal size={size} />
    )
}

export const ComputerIcon = ({ size = 17 }) => {
    return (
        <FaComputer size={size} />
    )
}

export const ClusterIcon = ({ size = 22 }) => {
    return (
        <BiLogoKubernetes size={size} />
    )
}

export const ApplicationIcon = ({ size = 20 }) => {
    return (
        <IoLogoAppleAr size={size} />
    )
}

export const AlertIcon = ({ size = 15 }) => {
    return (
        <BiError size={size} color={"yellow"} />
        // <BiError size={size} />
    )
}
export const ActiveIcon = ({ size = 15 }) => {
    return (
        <RiRadioButtonLine size={size} color={"green"} />
        // <RiRadioButtonLine size={size} />
    )
}

export const OfflineIcon = ({ size = 15 }) => {
    return (
        <RiRadioButtonLine size={size} color={"red"} />
        // <RiRadioButtonLine size={size} />
    )
}