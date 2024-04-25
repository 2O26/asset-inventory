import React from 'react'
import { Link } from 'react-router-dom';
import './Navbar.css'
import { UserIcon, ToolsIcon, DashboardIcon, SettingsIcon, ThemeIcon, LogOutIcon } from '../Icons/Icons';
import UserService from '../../Services/UserService';


export default function Navbar({ toggleTheme }) {

  const { doLogout } = UserService

  return (
      <div className='navbar'>
        <div className='logo'>
          <Link to="/">ASSET INVENTORY</Link>
        </div>
        <ul className="taskbar">
          <li>
            <Link to="/"><DashboardIcon/>Dashboard</Link>
          </li>
          <li>
            <Link to="/tools"><ToolsIcon/>Tools</Link>
          </li>
          <li>
            <Link to="/settings"><SettingsIcon/>Settings</Link>
          </li>
          <li style={{borderLeft: "1px solid var(--text-color)", height: "2.5rem", margin: "0 1rem", padding: 0}}></li>
          <li>
            <Link to="/profile"> <UserIcon/>Profile</Link>
          </li>
          <li>
            <Link onClick={() => doLogout()}> <LogOutIcon/>Sign Out</Link>
          </li>


        </ul>
        <ul className="actions">
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
              <Link onClick={() => window.open("http://localhost:6880/home/", "_blank")}>
                  Help</Link>
          </li>
          <li>
            <Link onClick={toggleTheme}><ThemeIcon/></Link>
          </li>
        </ul>
      </div>
  )
}
