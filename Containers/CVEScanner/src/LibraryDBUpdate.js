const CVEscanSave = require("./DatabaseConn/CVEconn");

async function FetchCycloneDX(assetID) {
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

async function RemoveExisting(cveSave, assetID) {
    cveSave.removeExistingAssetIDOccurances(assetID);
}

async function UpdateLibraryDatabase(cveSave, assetID, cycloneDXjson, previousState) {
    const newLibrariesMap = new Map();

    for (const component of cycloneDXjson.components) {
        if (component.type === "library") {
            await ProcessLibraryComponent(component, assetID, previousState, newLibrariesMap, cveSave);
        }
    }

    if (newLibrariesMap.size > 0) {
        await cveSave.savePartialLibraries(newLibrariesMap);
    }
}

async function ProcessLibraryComponent(component, assetID, previousState, newLibrariesMap, cveSave) {
    if (!Array.isArray(previousState)) {
        throw new Error("Invalid previousState: Expected an array");
    }

    const existingLibrary = previousState.find(library => library.purl === component.purl);

    if (existingLibrary) {
        AddAssetIdToExistingLibrary(existingLibrary, assetID);
        await cveSave.updateAssetIDstoLibraryEntry(component.purl, existingLibrary.assetids);
    } else {
        AddNewLibrary(component, assetID, newLibrariesMap);
    }
}

function AddAssetIdToExistingLibrary(library, assetID) {
    if (!library.assetids) {
        library.assetids = [];
    }
    if (!library.assetids.includes(assetID)) {
        library.assetids.push(assetID);
    }
}

function AddNewLibrary(component, assetID, librariesMap) {
    if (!librariesMap.has(component.purl)) {
        const newLibrary = {
            purl: component.purl,
            name: component.name,
            version: component.version,
            assetids: [assetID]
        };
        librariesMap.set(component.purl, newLibrary);
    }
}

async function LibraryDBupdate(assetID) {
    const cveSave = new CVEscanSave();
    try {
        await cveSave.connect();
        const previousState = await cveSave.getAllLibraries();
        const cycloneDXjson = await FetchCycloneDX(assetID);
        // console.log("Previous State:", previousState);
        // console.log("CycloneDX JSON:", cycloneDXjson);

        if (cycloneDXjson === "failure") {
            throw new Error("Failed to fetch SBOM data");
        }

        await RemoveExisting(cveSave, assetID);
        await UpdateLibraryDatabase(cveSave, assetID, cycloneDXjson, previousState);
        return "Update successful";
    } catch (err) {
        console.error("Error in LibraryDBupdate:", err);
        throw err; // Re-throw the error to ensure it's handled or visible outside.
    }
}


module.exports = { LibraryDBupdate, UpdateLibraryDatabase, ProcessLibraryComponent, AddAssetIdToExistingLibrary, AddNewLibrary, RemoveExisting, FetchCycloneDX };
