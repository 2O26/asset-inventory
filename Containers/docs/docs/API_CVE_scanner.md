

### /libraryDBupdate
Launched from the cycloneDX backend when a new SBOM is added.
- [x] Make a GET request to fetch the SBOM file of given asset
- [x] If assetID exists on any libraries, remove the entries. Alternatively remove the entire entry
- [x] Check if purl already exists in CVE library database.
    - [x] If yes, add the asset to the list
    - [x] If no, add a new library entry.
- [x] Partial save of the libraries to DB (We dont want to wait for all the external API calls to have functionality of library DB)
- [] API call to check CVEs for the new library entries (create call, just check conn and then exit func)
- [x] Make a GET request to fetch the SBOM file of given asset
- [x] If assetID exists on any libraries, remove the entries. Alternatively remove the entire entry
- [x] Check if purl already exists in CVE library database.
    - [x] If yes, add the asset to the list
    - [x] If no, add a new library entry.
- [x] Partial save of the libraries to DB (We dont want to wait for all the external API calls to have functionality of library DB)
- [x] API call to check CVEs for the new library entries (create call, just check conn and then exit func)

### /recheckVulnerabilitiesAll

POST request here to update the CVE database for the libraries

- [x] For each library + version combo
    - [x] Run function that invokes an external API call to check for CVEs
