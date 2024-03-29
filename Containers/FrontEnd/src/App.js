import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Keycloak from 'keycloak-js';
import Navbar from './components/common/Navbar/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Tools from './components/Tools/Tools';
import Help from './components/Help/Help';
import About from './components/About/About';
import Settings from './components/Settings/Settings';
import Profile from './components/Profile/Profile';
import SignIn from './components/SignIn/SignIn';
import AssetList from './components/Tools/AssetList/AssetList';
import AssetView from './components/AssetView/AssetView';
import GraphView from './components/Tools/GraphView/GraphView';
import NetworkScan from './components/Tools/NetworkScan/NetworkScan';

import './assets/styles/colors.css';
import './assets/styles/Global.css';

document.body.classList.add('dark');

function App() {
  const [theme, setTheme] = useState("dark");

  // Function to toggle between light and dark mode
  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light")
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      setTheme("dark")
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    }
  };

  return (
    <BrowserRouter>
      <Navbar toggleTheme={toggleTheme} />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/help" element={<Help />} />
        <Route path="/about" element={<About />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/asset-view/:assetID" element={<AssetView />} />
        <Route path="/tools/asset-list" element={<AssetList />} />
        <Route path="/tools/graph-view" element={<GraphView />} />
        <Route path="/tools/network-scan" element={<NetworkScan />} />
        {/* <Route path='*' element={<Navigate to='/' replace />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
