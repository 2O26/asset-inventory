// Importing the functions from your file
const {
    LibraryDBupdate,
    UpdateLibraryDatabase,
    ProcessLibraryComponent,
    AddAssetIdToExistingLibrary,
    AddNewLibrary,
    RemoveExisting,
    FetchCycloneDX
} = require('../LibraryDBUpdate.js');
const CVEscanSave = require("../DatabaseConn/CVEconn");

// Using jest-fetch-mock to mock fetch calls
require('jest-fetch-mock').enableMocks();

// Mocking the CVEscanSave class
jest.mock("../DatabaseConn/CVEconn", () => {
    return jest.fn().mockImplementation(() => {
        return {
            connect: jest.fn(),
            removeExistingAssetIDOccurances: jest.fn(),
            savePartialLibraries: jest.fn(),
            updateAssetIDstoLibraryEntry: jest.fn(),
            getAllLibraries: jest.fn()
        };
    });
});

describe('LibraryDBupdate System', () => {
    beforeEach(() => {
        fetch.resetMocks();
        const cveSave = new CVEscanSave();
        jest.spyOn(cveSave, 'getAllLibraries').mockResolvedValue([]);
        jest.spyOn(cveSave, 'connect').mockResolvedValue();
        jest.spyOn(cveSave, 'updateAssetIDstoLibraryEntry').mockResolvedValue();
        jest.spyOn(cveSave, 'savePartialLibraries').mockResolvedValue();
        jest.spyOn(cveSave, 'removeExistingAssetIDOccurances').mockResolvedValue();
    });


    describe('FetchCycloneDX', () => {
        it('should return JSON object on successful fetch', async () => {
            const mockJson = { components: [] };
            fetch.mockResponseOnce(JSON.stringify(mockJson), { status: 200 });
            const result = await FetchCycloneDX('123');
            expect(result).toEqual(mockJson);
        });

        it('should return "failure" when fetch fails', async () => {
            fetch.mockResponseOnce(null, { status: 404 });
            const result = await FetchCycloneDX('123');
            expect(result).toBe('failure');
        });

    });

    describe('RemoveExisting', () => {
        it('should call removeExistingAssetIDOccurances with the correct assetID', async () => {
            const cveSave = new CVEscanSave();
            await RemoveExisting(cveSave, '123');
            expect(cveSave.removeExistingAssetIDOccurances).toHaveBeenCalledWith('123');
        });

        it('should handle special characters in assetID correctly', async () => {
            const cveSave = new CVEscanSave();
            await RemoveExisting(cveSave, 'special#char&123');
            expect(cveSave.removeExistingAssetIDOccurances).toHaveBeenCalledWith('special#char&123');
        });

    });

    describe('UpdateLibraryDatabase', () => {
        it('should call savePartialLibraries if there are new libraries', async () => {
            const cveSave = new CVEscanSave();
            const cycloneDXjson = { components: [{ type: 'library', purl: 'purl1' }] };
            const previousState = [];
            await UpdateLibraryDatabase(cveSave, '123', cycloneDXjson, previousState);
            expect(cveSave.savePartialLibraries).toHaveBeenCalled();
        });

        it('should not call savePartialLibraries if there are no library components', async () => {
            const cveSave = new CVEscanSave();
            const cycloneDXjson = { components: [{ type: 'not-library', purl: 'purl1' }] };
            const previousState = [];
            await UpdateLibraryDatabase(cveSave, '123', cycloneDXjson, previousState);
            expect(cveSave.savePartialLibraries).not.toHaveBeenCalled();
        });

        it('should only process library components', async () => {
            const cveSave = new CVEscanSave();
            const cycloneDXjson = {
                components: [
                    { type: 'library', purl: 'purl1' },
                    { type: 'application', purl: 'purl2' }
                ]
            };
            const previousState = [];
            await UpdateLibraryDatabase(cveSave, '123', cycloneDXjson, previousState);
            expect(cveSave.savePartialLibraries).toHaveBeenCalledTimes(1);
            expect(cveSave.updateAssetIDstoLibraryEntry).not.toHaveBeenCalledWith('purl2', expect.anything());
        });

    });

    describe('ProcessLibraryComponent', () => {
        it('should add asset ID to existing library and update database', async () => {
            const cveSave = new CVEscanSave();
            const component = { purl: 'purl1', type: 'library' };
            const previousState = [{ purl: 'purl1', assetids: ['456'] }];
            const newLibrariesMap = new Map();
            await ProcessLibraryComponent(component, '123', previousState, newLibrariesMap, cveSave);
            expect(cveSave.updateAssetIDstoLibraryEntry).toHaveBeenCalledWith('purl1', ['456', '123']);
        });

        it('should add new library if it does not exist', async () => {
            const cveSave = new CVEscanSave();
            const component = { purl: 'purl2', type: 'library' };
            const previousState = [{ purl: 'purl1', assetids: ['456'] }];
            const newLibrariesMap = new Map();
            await ProcessLibraryComponent(component, '123', previousState, newLibrariesMap, cveSave);
            expect(newLibrariesMap.has('purl2')).toBe(true);
        });

        it('should create a new library entry when no existing library matches', async () => {
            const cveSave = new CVEscanSave();
            const component = { purl: 'purl3', type: 'library' };
            const previousState = [{ purl: 'purl1', assetids: ['456'] }];
            const newLibrariesMap = new Map();
            await ProcessLibraryComponent(component, '789', previousState, newLibrariesMap, cveSave);
            expect(newLibrariesMap.has('purl3')).toBe(true);
            expect(newLibrariesMap.get('purl3').assetids).toContain('789');
        });

    });

    describe('AddAssetIdToExistingLibrary', () => {
        it('should add asset ID to the existing library', () => {
            const library = { assetids: ['456'] };
            AddAssetIdToExistingLibrary(library, '123');
            expect(library.assetids).toContain('123');
        });
    });

    describe('AddNewLibrary', () => {
        it('should add a new library to the map if purl does not exist', () => {
            const librariesMap = new Map();
            const component = { purl: 'purl1', name: 'Library1', version: '1.0' };
            AddNewLibrary(component, '123', librariesMap);
            expect(librariesMap.has('purl1')).toBe(true);
            expect(librariesMap.get('purl1')).toEqual({ purl: 'purl1', name: 'Library1', version: '1.0', assetids: ['123'] });
        });
    });

    describe('LibraryDBupdate', () => {
        it('should update the library database successfully', async () => {
            const cveSave = new CVEscanSave();
            cveSave.connect.mockResolvedValue();
            cveSave.getAllLibraries.mockResolvedValue([]); // Ensure this is returning a promise
            fetch.mockResponseOnce(JSON.stringify({ components: [] }), { status: 200 });

            const result = await LibraryDBupdate('123');
            expect(result).toBe("Update successful");
        });

        it('should throw an error if fetching SBOM data fails', async () => {
            const cveSave = new CVEscanSave();
            cveSave.connect.mockResolvedValue();
            cveSave.getAllLibraries.mockResolvedValue([]); // Ensure this is returning a promise
            fetch.mockResponseOnce(null, { status: 404 });

            await expect(LibraryDBupdate('123')).rejects.toThrow("Failed to fetch SBOM data");
        });

        // it('should successfully update the library with mixed component results', async () => {
        //     const cveSave = new CVEscanSave();
        //     cveSave.connect.mockResolvedValue();
        //     cveSave.getAllLibraries.mockResolvedValue([{ purl: 'purl1', assetids: ['456'] }]);
        //     fetch.mockResponseOnce(JSON.stringify({
        //         components: [
        //             { type: 'library', purl: 'purl1' },
        //             { type: 'library', purl: 'purl3' }
        //         ]
        //     }), { status: 200 });

        //     await expect(LibraryDBupdate('123')).resolves.toBe("Update successful");
        //     expect(cveSave.updateAssetIDstoLibraryEntry).toHaveBeenCalledWith('purl1', ['456', '123']);
        // });

    });
});

