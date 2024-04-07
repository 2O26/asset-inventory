const { NpmAuditWrapper, MavenDependencyCheckWrapper, GovulncheckWrapper, PythonSafetyWrapper } = require("./Wrappers/vulnerbilityCheckwrappers");
// async function checkWithAPI(cycloneDXdata) {
//     const apiKey = process.env.API_KEY;
//     const apiPath = process.env.API_PATH;
//     console.log(`Your API Key is: ${apiKey}\n and your API path is:\n${apiPath}`);

//     try {
//         const response = await fetch(toString(apiPath), {
//             method: 'GET',
//             headers: {
//                 'Authorization': `token ${apiKey}`,
//             },
//         });
//         console.log(response);
//         const return_data = await response.json();

//         console.log(return_data);
//         return return_data;
//     } catch (err) {
//         throw new Error('Error fetching API');
//     }
// }

async function extractLibraries(components) {
    /*
        Function returns an object that fetches the package name and version and sorts it under the package type
    */
    const supportedCheckers = [
        "pkg:npm",
        "pkg:maven" //,
        // "go",
        // "py"
    ]

    const extracted = {}

    supportedCheckers.forEach((value, index) => {
        extracted[value] = {}
    })

    components.forEach((component, index) => {
        if (component.type === "library") {
            supportedCheckers.forEach((substring, index) => {
                if (component["bom-ref"].includes(substring)) {
                    extracted[substring][component.name] = component.version;
                }
            })
        }
    })

    return extracted;
}

async function hardcodedResponse() {
    const hardcodedjson = "";
    return hardcodedjson;
}

async function CVEcheck(cycloneDXdata) {

    const mainSoftwareName = cycloneDXdata.metadata.component.name;
    const mainSoftwareVersion = cycloneDXdata.metadata.component.version;
    const mainSoftwareVendor = cycloneDXdata.metadata.component.vendor;

    const libraries = await extractLibraries(cycloneDXdata.components);
    // TODO: Create parallel promises to get the vulns from npm, pip, go, maven
    const npmVulns = await NpmAuditWrapper(libraries["pkg:npm"]);

    return { "npm": npmVulns };
}

module.exports = { CVEcheck };