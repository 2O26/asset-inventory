const fs_promise = require('fs/promises');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const process = require('process');
const { spawn } = require('child_process');


async function createDirectoryIfNotExist(directoryPath) {
    try {
        await fs_promise.mkdir(directoryPath, { recursive: true });
        console.log(`Directory created or already exists: ${directoryPath}`);
    } catch (error) {
        console.error(`Error creating directory: ${error}`);
    }
}

async function fileExists(filePath) {
    try {
        await fs_promise.access(filePath, fs.constants.F_OK);
        return true; // File exists
    } catch {
        return false; // File does not exist
    }
}

function runNpmAudit() {
    return new Promise((resolve, reject) => {
        const child = spawn('npm', ['audit', '--json']);
        let stdoutData = '';
        let stderrData = '';

        child.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        child.on('close', (code) => {
            if (stderrData) {
                console.error("npm audit reported errors or warnings:", stderrData);
                return reject(new Error(stderrData));
            }

            try {
                const auditResult = JSON.parse(stdoutData);
                resolve(auditResult);
            } catch (parseErr) {
                console.error("Failed to parse npm audit output:", parseErr);
                reject(parseErr);
            }
        });

        child.on('error', (error) => {
            console.error("Failed to start subprocess:", error);
            reject(error);
        });
    });
}

async function NpmAuditWrapper(libraries) {
    /*
        Using npm audit to see if any npm packages contains vulnerabilties
    */

    const packageJsonFormat = {
        "name": "temp",
        "version": "1.0.0",
        "dependencies": libraries
    }

    try {

        await createDirectoryIfNotExist('/app/npmVulnCheck/');
        // Change the current working directory
        process.chdir('/app/npmVulnCheck');

        console.log('New directory: ' + process.cwd());
    } catch (err) {
        console.error('Failed to change directory: ' + err);
    }

    try {
        const dataString = JSON.stringify(packageJsonFormat, null, 2);

        // Write contents to file
        await fs_promise.writeFile('package.json', dataString, 'utf8', function (err) {
            if (err) {
                console.log("An error occurred while writing JSON Object to File.");
                throw new Error(`${error}`);
            }

            console.log("JSON file package.json has been saved. Ready to be audited");
        });
    } catch (err) {
        console.log("Error in creating package.json file: ", err)
        return {};
    }

    if (!(await fileExists("package-lock.json"))) {
        // Perform actions for when the file does not exists
        try {
            // Run npm audit and parse the JSON output
            const { stdout, stderr } = await exec('npm i --package-lock-only');
        } catch (err) {
            console.log("Failure in generating package-lock: ", err);
            return {}
        }
    }

    auditResult = {}
    // try {
    try {
        auditResult = await runNpmAudit();
        // Process the auditResult here
    } catch (error) {
        console.error("Audit or parsing failed:", error);
        // Handle the error or fallback here
    }


    // change back to base directory
    try {
        // Change the current working directory
        process.chdir('/app/');

        console.log('New directory: ' + process.cwd());
    } catch (err) {
        console.error('Failed to change directory: ' + err);
    }

    // console.log(auditResult)
    return auditResult;
}

async function MavenDependencyCheckWrapper(libraries) {
    // mvn dependency-check:check

}

async function GovulncheckWrapper(libraries) {
    // https://vuln.go.dev/
    // govulncheck ./...
}

async function PythonSafetyWrapper(libraries) {
    // pipenv lock --requirements --json | safety check --stdin

}

module.exports = { NpmAuditWrapper, MavenDependencyCheckWrapper, GovulncheckWrapper, PythonSafetyWrapper };