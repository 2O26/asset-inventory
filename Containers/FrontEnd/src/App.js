import { useState, useEffect } from 'react';
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
import History from './components/Tools/History/History';
import SBOMLibrarySearch from './components/Tools/SBOMLibrarySearch/SBOMLibrarySearch';

import { useMutation, useQuery } from '@tanstack/react-query';
import { SaveUserSetting, GetUserSettings } from './components/Services/ApiService';

import './assets/styles/colors.css';
import './assets/styles/Global.css';

document.body.classList.add('dark');

function App() {
  const [theme, setTheme] = useState("dark");

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: SaveUserSetting,
    onSuccess: (data) => {
      // window.alert("Settings Saved")
      refetchUserSettings();
    },
    onError: (error) => {
      console.error("Save Dashboard Config: ", error);
    }
  });


  const { data: userSettingData, isLoading: isLoadingUserSettings, isError: isUserSettings, error: errorUserSettings, refetch: refetchUserSettings } = useQuery({
    queryKey: ['User Settings'],
    queryFn: GetUserSettings,
    enabled: true
  });

  // Function to toggle between light and dark mode
  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light")
      document.body.classList.add('light');
      document.body.classList.remove('dark');
      try {
        mutate({
          update: { "darkmode": false }
        });
      } catch (err) {
        console.log("Could not change darkmode setting in user settings backend")
      }
    } else {
      setTheme("dark")
      document.body.classList.add('dark');
      document.body.classList.remove('light');
      try {
        mutate({
          update: { "darkmode": true }
        });
      } catch (err) {
        console.log("Could not change darkmode setting in user settings backend")
      }
    }
    // try to add user setting change, catch. Send error msg in console log (and use local color)
  };

  useEffect(() => {
    if (userSettingData) {
      if (userSettingData.userSettings) {
        if (userSettingData.userSettings[0].darkmode) {
          setTheme("dark");
          document.body.classList.add('dark');
          document.body.classList.remove('light');
        } else {
          setTheme("light")
          document.body.classList.add('light');
          document.body.classList.remove('dark');
        }
      }
    }
  }, [userSettingData])

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
        <Route path="/tools/history" element={<History />} />
        <Route path="/tools/SBOMLibrarySearch" element={<SBOMLibrarySearch />} />
        {/* <Route path='*' element={<Navigate to='/' replace />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
