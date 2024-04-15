const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
var dbServer = 'cyclonedxstorage:27020';
const dbName = 'librarystorage';

const LibrarySchema = require("../Schemas/LibrarySchema");

class CVEscanSave {
    constructor() { }

    async connect() {
        let connection = `mongodb://${dbServer}/${dbName}`;
        return mongoose.connect(connection)
            .then(() => {
                console.log('Connected to DB:', dbName);
            })
            .catch((err) => {
                console.error('Database connection error', dbName);
                console.error(' trying to connect to server:', connection);
            });
    };


    async getAllLibraries() {
        const libraries = await LibrarySchema.find().exec();
        return libraries;
    }

    async getVulnerableAssetIDLibraries(assetid) {
        var query = {
            assetids: {
                $in: [assetid]
            }, // Checks if the asset ID is in the assetids array
            $or: [
                { "CVE.title": { $exists: true, $ne: "" } },
                { "CVE.cvss": { $exists: true, $ne: null } },
                { "CVE.severity": { $exists: true, $ne: "" } },
                { "CVE.url": { $exists: true, $ne: "" } }
            ]
        };
        const libraries = await LibrarySchema.find(query).exec();
        return libraries
    }

    async getVulnerableAllLibraries(assetid) {
        var query = {
            $or: [
                { "CVE.title": { $exists: true, $ne: "" } },
                { "CVE.cvss": { $exists: true, $ne: null } },
                { "CVE.severity": { $exists: true, $ne: "" } },
                { "CVE.url": { $exists: true, $ne: "" } }
            ]
        };
        const libraries = await LibrarySchema.find(query).exec();
        return libraries
    }

    async savePartialLibraries(newLibrariesMap) {
        if (newLibrariesMap instanceof Map && newLibrariesMap.size > 0) {
            const librariesToInsert = [];

            newLibrariesMap.forEach((newlibVals, purl) => {
                // Prepare the document to insert
                const newLibraryDoc = new LibrarySchema({
                    purl: newlibVals.purl,
                    assetids: newlibVals.assetids,
                    name: newlibVals.name,
                    version: newlibVals.version,
                    CVE: {}
                });
                librariesToInsert.push(newLibraryDoc);
            });

            try {
                // Use insertMany to insert all new libraries at once
                await LibrarySchema.insertMany(librariesToInsert);
            } catch (err) {
                console.log('Error while batch inserting libraries:', err.message);
            }
        } else {
            console.log('No libraries to save');
        }
    }

    async updateAssetIDstoLibraryEntry(purl, assetids) {

        const filter = { purl: purl }
        try {
            const result = await LibrarySchema.findOneAndUpdate(filter, { assetids: assetids });
        } catch (err) {
            console.error("Error updating asset IDs for library:", err);
        }
    }

    async removeExistingAssetIDOccurances(assetID) {
        const result = await LibrarySchema.updateMany(
            { assetids: assetID },
            { $pull: { assetids: assetID } }
        );
        if (result.modifiedCount > 0) {
            const deleteResult = await LibrarySchema.deleteMany({ assetids: { $size: 0 } });
        } else {
            console.log('No documents found with that assetID or removal was unnecessary.');
        }
    }

    async getPurls(assetID) {
        try {
            const results = await LibrarySchema.find({
                assetids: {
                    $in: [assetID]
                }
            });
            const reducedResult = await results.map(result => result.purl)
            return reducedResult;
        } catch (error) {
            console.error('Error fetching documents:', error);
            return [];
        }
    }

    async addCVEsToPurl(purlsWithVulnerbilities) {
        Object.keys(purlsWithVulnerbilities).forEach(async key => {
            try {
                await LibrarySchema.findOneAndUpdate(
                    { purl: key },
                    {
                        $set: { CVE: purlsWithVulnerbilities[key] }
                    }
                )
            } catch (err) {
                console.log("Could not add the library CVEs to the database...")
            }
        })


    }

}

module.exports = CVEscanSave;