import React from 'react'
import { Link } from 'react-router-dom';
import './Navbar.css'
import { UserIcon, ToolsIcon, DashboardIcon, SettingsIcon, LogInIcon, ThemeIcon, LogOutIcon } from '../Icons/Icons';
import UserService from '../../Services/UserService';


export default function Navbar({ toggleTheme }) {

  const { doLogout } = UserService

  return (
    <div className='navbar'>
      <ul>
        <li>
          <Link to="/"><DashboardIcon />Dashboard</Link>
        </li>
        <li>
          <Link to="/tools"><ToolsIcon />Tools</Link>
        </li>
        <li >
          <Link to="/settings" ><SettingsIcon />Settings</Link>
        </li>
        <li style={{ borderLeft: "1px solid var(--text-color)", height: "2.5rem", margin: "0 1rem", padding: 0 }}></li>
        <li >
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link onClick={() => window.open("http://localhost:6880/home/", "_blank")}>
            Help</Link>
        </li>
      </ul>
      <div className='logo'>
        <Link to="/">ASSET INVENTORY</Link>
      </div>
      <ul style={{ marginLeft: "auto" }}>
        <li>
          <Link to="/profile"> <UserIcon />Profile</Link>
        </li>
        {/* <li>
          <Link to="/signin"> <LogInIcon />Sign in</Link>
        </li> */}
        <li>
          <Link onClick={() => doLogout()}> <LogOutIcon />Log Out</Link>
        </li>
        <li>
          <Link onClick={toggleTheme} ><ThemeIcon /></Link>
        </li>
      </ul>
    </div>
  )
}
