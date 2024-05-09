# Adding a Plugin to the Dashboard

## Introduction
This document provides a step-by-step guide on how to add a new plugin/tool (React component) to the dashboard. We'll illustrate how to import and add the plugin to the `dashboardTools` map in `Tools/Tools.jsx`.

## Prerequisites
1. **Basic Knowledge of React Components**: Familiarity with how React components work.
2. **Access to the Codebase**: Make sure you have access to the relevant files in the repository.
3. **Icon Availability**: If you want to include an icon, you can find suitable icons at [react-icons](https://react-icons.github.io/react-icons/).

## Steps to Add a Plugin to the Dashboard

### 1. Import the Plugin and Icon
1. Navigate to `Tools/Tools.jsx`.
2. Import the plugin (React component) and its associated icon.

```js
import { AssetListIcon, GraphIcon, YourPluginIcon } from '../common/Icons/Icons';

import AssetList from './AssetList/AssetList.jsx';
import GraphView from './GraphView/GraphView.jsx';
import YourPlugin from './YourPlugin/YourPlugin.jsx';  // Replace with your plugin
```
### 2. Add the Plugin to the dashboardTools Map

1. Locate the `dashboardTools` function within `Tools/Tools.jsx`.
2. Add the new plugin entry to the map, following the existing pattern.

```js
export const dashboardTools = ({ size = 60, width = "100%", height = "100%" } = {}) => (
    {
        "Asset List": {
            "icon": <AssetListIcon size={size} />,
            "component": <AssetList width={width} height={height} isDashboard={true} />,
        },
        "Graph View": {
            "icon": <GraphIcon size={size} />,
            "component": <GraphView width={width} height={height} isDashboard={true} />,
        },
        "Your Plugin": {  // Replace with your plugin's name
            "icon": <YourPluginIcon size={size} />,
            "component": <YourPlugin width={width} height={height} isDashboard={true} />,
        }
    }
);
```
### 3. Adjust the Plugin Component for Dashboard View

1. Ensure your plugin component accepts the `isDashboard` prop.
2. Use the `isDashboard` prop to adjust the displayed content.
3. Reference existing components for implementation examples.

```js
// YourPlugin.jsx (Example)
const YourPlugin = ({ width = "100%", height = "100%", isDashboard = false }) => {
    return (
        <div style={{ width, height }}>
            {isDashboard ? (
                // Simplified content for dashboard view
                <div>Dashboard View</div>
            ) : (
                // Full content for regular view
                <div>Full Plugin Content</div>
            )}
        </div>
    );
};
export default YourPlugin;
```

### 4. Verify the Implementation

1. ***Restart the Development Server:*** If it's already running.
    - NOTE: Saving the file and reloading the page should be enough if you are running the dev version.
2. ***Navigate to the Dashboard Page:*** Confirm the new plugin appears in the dashboard.
3. ***Check for Errors:*** Ensure no errors occur during rendering.

### Conclusion

By following these steps, you have successfully added a new plugin to the dashboard. If you encounter any issues, refer to other components like `AssetList` or `GraphView` for further insights.