// ./test/example.test.ts
import test from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import { FileDatabase } from '../src/services/fileDatabase.js';
import { fetchFile, vaultExists } from '../src/utils/fileDatabase.utils.js';
import { MediaVault } from '../src/services/vault.js';
import { MediaBinary } from '../src/models/mediaModel.js';

const fileDatabaseRootPath = './test/media';

export default async function runFileDatabaseTests() {

    // Setup File Database Tests
    await initializeMedia();

    test('File Database passes all units', async (t) => {
        let fdbQ: FileDatabase | undefined;
        let success = true;

        await t.test('File Database can be created at a specified location', async (t) => {
            try {
                fdbQ = await FileDatabase.from(fileDatabaseRootPath);
            } catch (e) {
                success = false;
            }

            assertFileDatabaseDefined(success, fdbQ);       

            if (fdbQ !== undefined) {
                let fdb : FileDatabase = fdbQ;

                assert.notStrictEqual(fdb.index, undefined);

                if (fdb.index !== undefined) {

                    assert.strictEqual(fdb.index.entryKeys.size, 0);
                    
                    await t.test('Can add a new vault for images', async (t) => {
                        await fdb.createVault('img', new MediaVault());
                        
                        assert.strictEqual(fdb.index.entryKeys.size, 1);
                        assert.strictEqual(await vaultExists(fdb.rootPath + '/img'), true);
                    });
                    
                    await t.test('Can add new media to image vault', async (t) => {
                        let dvault = fdb?.getVault('img');
                        
                        assert.notStrictEqual(dvault, undefined, 'File database undefined');
                        
                        if (dvault !== undefined) {
                            let mediaName  = 'test.png';
                            let x = await getMediaBinary(mediaName);
                            dvault.addEntry(mediaName, x);
                            
                        }
                    });
                }
            }
        });
            
            await t.test('File database can be reloaded from secondary memory', async (t) => {
                try {
                    fdb = await FileDatabase.from(fileDatabaseRootPath);
                } catch (e) {
                    success = false;
                }
                
                assertFileDatabaseDefined(success, fdb);
                
                assert.strictEqual(fdb?.index?.entryKeys.size, 1, 'Index count is 1');
                
                assertVaultExists(fdb, 'img');
            })
            
        
    });

    function assertFileDatabaseDefined(success: boolean, fdb: FileDatabase | undefined) {
        assert.strictEqual(success, true, 'No exceptions');
        assert.notStrictEqual(fdb, undefined, 'File Database defined');
    }

    function assertVaultExists(fdb: FileDatabase | undefined, vaultKey : string) {
        assert.strictEqual(fdb?.index?.entryKeys.has(vaultKey), true, 'Vault present in index');

        assert.strictEqual(fdb.hasVault(vaultKey), true, 'Vault is present in vault collection');
        assert.notStrictEqual(fdb.getVault(vaultKey), undefined, 'Vault is present in vault collection');
    }
}

async function initializeMedia() {
    try {
        await fs.rm(fileDatabaseRootPath, { 'recursive': true, 'force': true });
    } catch (e) { }
}

async function getMediaBinary(mediaName : string) : Promise<MediaBinary> {
    return await fetchFile(`./test/${mediaName}`);
}