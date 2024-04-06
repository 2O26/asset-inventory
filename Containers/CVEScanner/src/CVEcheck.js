async function CVEcheck(cycloneDXdata) {

    const mainSoftwareName = cycloneDXdata.metadata.component.name;
    const mainSoftwareVersion = cycloneDXdata.metadata.component.version;
    const mainSoftwareVendor = cycloneDXdata.metadata.component.vendor;
    // vendor, product, and version components are REQUIRED to contain values other than "*".
    // fetchCvesForLibrary("django", '3.0.5')

    return { "test": "libraries" }
}

module.exports = { CVEcheck };