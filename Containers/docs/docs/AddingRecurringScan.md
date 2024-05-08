
## How to add plugin to recurring scan
1. Add your tool to the Plugins object in Containers/Frontend/src/components/Tools/Plugins.jsx
2. Is it a scan that requires IP ranges:
    - Yes, base code on 'Network Scan' in RecurringScanSettings.jsx. And add or statements to reat the plugintype of your choice.
    - No, base code on 'CVE scan'in RecurringScanSettings.jsx.
3. Add your tool to Plugins.js in congihandler microservice under Confighandler/src/Plugins.js. Add the name and the network path the scan should prompt to to start the scan.
4. If no ipranges are added. Make sure that the plugintype of choice is triggered by a HTTP GET request. If ip ranges it should be a POST request.