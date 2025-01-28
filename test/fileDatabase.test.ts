// ./test/example.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import { FileDatabase } from '../src/services/fileDatabase.js';
import { vaultExists } from '../src/utils/file.js';
import { testPngBytes, getMediaBinary } from './data.js';
import { MediaVaultType } from '../src/models/mediaModelFactory.js';
import { ImageBinary } from '../src/models/mediaModel.js';

export default async function runFileDatabaseTests(fileDatabaseRootPath : string) {

    // Setup File Database Tests
    await initializeMedia();
    
    await test('File Database passes all units', async (t) => {
        let fdbQ: FileDatabase | undefined;
        let success = true;

        // Used for several tests
        let mediaName = 'test.png';
        let entryKey = {key: 'test', type: MediaVaultType.Image};
        let vaultKey = {key: 'img', type: MediaVaultType.Image};

        await t.test('File Database can be created at a specified location', async (t) => {
            try {
                fdbQ = await FileDatabase.from(fileDatabaseRootPath);
            } catch (e) {
                success = false;
            }

            assertFileDatabaseDefined(success, fdbQ);

            if (fdbQ !== undefined) {
                let fdb: FileDatabase = fdbQ;

                assert.strictEqual(fdb.getIndexSize(), 0, 'Index is not empty');

                await t.test('Can add a new vault for images', async (t) => {
                    await fdb.createVault({key: 'img', type: MediaVaultType.Image});

                    assert.strictEqual(fdb.getIndexSize(), 1, 'Index does not contain a single element');
                    assert.strictEqual(await vaultExists(fdb.rootPath + '/img'), true, 'Index does not contain the img entry');
                });

                await t.test('Can add new media to image vault', async (t) => {
                    // Arrange
                    let image = await getMediaBinary(mediaName, MediaVaultType.Image, {buffer: Buffer.from(testPngBytes), size: testPngBytes.length, extension: '.png', aspectRatio: 1.0});

                    // Act
                    await fdb.registerResource(MediaVaultType.Image, vaultKey, entryKey, image);
                    
                    // Assert
                    let directoryVault = fdb.getVault(vaultKey);
                    assert.notStrictEqual(directoryVault, undefined, 'Vault undefined');
                    assert.strictEqual(directoryVault?.hasIndexEntry(entryKey), true, 'Added image is not in the index');                    
                });

                await t.test('Can load valid resource from vault', async (t) => {
                    const directoryVault = fdb.getVault(vaultKey);

                    assert.notStrictEqual(directoryVault, undefined, 'Vault is undefined');

                    if (directoryVault !== undefined) {                        
                        let media = await fdb.loadResource(vaultKey.type, vaultKey, entryKey);
                        assertValidImageResource(media as ImageBinary);
                    }
                });

                await t.test('Deny access to nonexistent vault', async (t) => {
                    let success = true;
                    let vault;
                    try {
                        let nonExistentVault = {key: 'i-do-not-exist', type: MediaVaultType.Image};
                        let nonExistentEntry = {key: 'something', type: MediaVaultType.Image};
                        await fdb.loadResource(MediaVaultType.Image, nonExistentVault, nonExistentEntry);
                        vault = fdb.getVault(nonExistentVault);
                    } catch (error) {
                        success = false;
                    }
                    
                    assert.strictEqual(success, true, 'Exceptions occurred during access of invalid vault');
                    
                    assert.strictEqual(vault, undefined, 'Nonexistent vault returned data');
                });

                await t.test('Deny access to nonexistent resource', async (t) => {
                    let success = true;
                    try {
                        let nonExistentEntry = {key: 'i-do-not-exist', type: MediaVaultType.Image};
                        await fdb.loadResource(MediaVaultType.Image, vaultKey, nonExistentEntry);
                    } catch (error) {
                        success = false;
                    }

                    assert.strictEqual(success, true, 'Exceptions occurred during access of invalid resource');
                });
            }
        });

        await t.test('File database can be reloaded from secondary memory', async (t) => {
            await t.test('Can load file database and indexes from secondary memory', async (t) => {                
                let success = true;
            
                try {
                    fdbQ = await FileDatabase.from(fileDatabaseRootPath);
                } catch (e) {
                    success = false;
                }
                
                assertFileDatabaseDefined(success, fdbQ);
                
                if (fdbQ !== undefined) {
                    let fdb = fdbQ;
                    
                    assert.strictEqual(fdb.getIndexSize(), 1, 'Index count is not 1');
                    assertVaultExists(fdb, {key: 'img', type: MediaVaultType.Image});

                    await t.test('Can load valid resource from vault', async (t) => {
                        const directoryVault = fdb.getVault(vaultKey);
        
                            assert.notStrictEqual(directoryVault, undefined, 'Vault is undefined');
        
                            if (directoryVault !== undefined) {                        
                                let media = await fdb.loadResource(vaultKey.type, vaultKey, entryKey);
                                assertValidImageResource(media as ImageBinary);
                            }
                    });
                }
            });            
        });
    });
    
    // --------------------------------- Helpers -------------------------------------------

    async function initializeMedia() {
        try {
            await fs.rm(fileDatabaseRootPath, { 'recursive': true, 'force': true });
        } catch (e) { }
    }

    function assertFileDatabaseDefined(success: boolean, fdb: FileDatabase | undefined) {
        assert.strictEqual(success, true, 'No exceptions');
        assert.notStrictEqual(fdb, undefined, 'File Database undefined');
    }

    function assertVaultExists(fdb: FileDatabase, vaultKey: {key: string, type: MediaVaultType}) {
        assert.strictEqual(fdb.hasIndexEntry(vaultKey), true, 'Vault not present in index');

        assert.strictEqual(fdb.hasVault(vaultKey), true, 'Vault is not present in vault collection');
        assert.notStrictEqual(fdb.getVault(vaultKey), undefined, 'Vault is not present in vault collection');
    }

    function assertValidImageResource(media: ImageBinary) {
        assert.notStrictEqual(media, undefined, 'Image package is undefined');
        assert.strictEqual(media.size > 0, true, 'Image size is not above 0');
        assert.strictEqual(media.buffer.length, testPngBytes.length, 'Number of bytes differs');

        for (let i = 0; i < media.buffer.length; i++) {
            // console.log(media.buffer[i].toString(10) + ',');
            assert.strictEqual(media.buffer[i], testPngBytes[i], `Byte index ${i} are not equal`);
            assert.strictEqual(media.extension, '.png', 'Extension is not .png');
            assert.strictEqual(media.aspectRatio, 1.0, 'Aspect ratio is not 1.0');
        }
    }
}
