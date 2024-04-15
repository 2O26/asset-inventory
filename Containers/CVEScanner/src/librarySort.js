const CVEscanSave = require("./DatabaseConn/CVEconn");

async function fetchCycloneDX(assetID) {
    const cycloneDXResponse = await fetch(`http://cyclonedx:8082/getCycloneDXFile?assetID=${assetID}`);
    if (cycloneDXResponse.status !== 200) {
        return "failure";
    }
    const cycloneDXjson = await cycloneDXResponse.json()
    if (!cycloneDXjson.components) {
        return "failure";
    }
    return cycloneDXjson
}

async function removeExisting(cveSave, assetID) {
    cveSave.removeExistingAssetIDOccurances(assetID);
}

async function updateLibDB(cveSave, assetID, cycloneDXjson, previousState) {
    // First iterate over new data as the previousState can be empty.
    const newLibrariesMap = new Map(); // Use a Map to track new libraries by purl for quick lookup
    cycloneDXjson.components.forEach(async component => {
        if (component.type === "library") {
            const existingLibrary = previousState.find(libraryPrev => libraryPrev.purl === component.purl);

            if (existingLibrary) {
                if (!existingLibrary.assetids) {
                    existingLibrary.assetids = []; // Initialize if not present
                }
                existingLibrary.assetids.push(assetID);
                await cveSave.updateAssetIDstoLibraryEntry(component.purl, existingLibrary.assetids);
            } else if (!newLibrariesMap.has(component.purl)) { // Check if not already added to newLibraries
                const newLib = {
                    purl: component.purl,
                    name: component.name,
                    version: component.version,
                    assetids: [assetID] // Initialize assetids with current assetID
                };
                newLibrariesMap.set(component.purl, newLib);
            }
        }
    });
    await cveSave.savePartialLibraries(newLibrariesMap); // Save partial to database
}

function LibraryDBupdate(assetID, res) {
    const cveSave = new CVEscanSave();
    cveSave.connect()
        .then(() => cveSave.getPrevLibraries())
        .then(async previousState => {

            const cycloneDXjson = await fetchCycloneDX(assetID);
            if (cycloneDXjson === "failure") {
                res.json({ success: false, message: "Failure to fetch SBOM data" });
                return;
            }
            removeExisting(cveSave, assetID);
            updateLibDB(cveSave, assetID, cycloneDXjson, previousState)
        }).catch((err) => {
            console.log("Could not get previous state of libraries: ", err)
            res.json({ Success: false });
            return
        });
}



module.exports = { LibraryDBupdate };
