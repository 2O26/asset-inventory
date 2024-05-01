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
    let newLibrariesMap = new Map(); // Use a Map to track new libraries by purl for quick lookup
    cycloneDXjson.components.forEach(async component => {
        if (component.type === "library") {
            const existingLibrary = previousState.find(libraryPrev => libraryPrev.purl === component.purl);

            if (existingLibrary) {
                if (!existingLibrary.assetids) {
                    existingLibrary.assetids = [];
                }
                if (!existingLibrary.assetids.includes(assetID)) {
                    // We dont want to add the assetid if it already exists in the array (avoid duplicates)
                    existingLibrary.assetids.push(assetID);
                }
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

async function LibraryDBupdate(assetID) {
    const cveSave = new CVEscanSave();
    await cveSave.connect();

    const previousState = await cveSave.getAllLibraries().catch(err => {
        console.error("Could not get previous state of libraries:", err);
        throw new Error("Database connection failed");
    });

    const cycloneDXjson = await fetchCycloneDX(assetID);
    if (cycloneDXjson === "failure") {
        throw new Error("Failed to fetch SBOM data");
    }

    await removeExisting(cveSave, assetID);
    await updateLibDB(cveSave, assetID, cycloneDXjson, previousState);
    return "Update successful";
}

module.exports = { LibraryDBupdate };
