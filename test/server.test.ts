import test from "node:test";
import assert from "node:assert";
import { Server } from "../src/services/server.js";
import { getMediaBinary, getMediaBinaryDto, testPngBytes } from "./data.js";
import { fetchJSON } from "../src/utils/file.js";
import { APIKeySet } from "../src/utils/secrets.js";
import { MediaVaultType } from "../src/models/mediaModelFactory.js";
import { ImageBinaryDto } from "../src/models/mediaModel.js";

export default async function runServerTests(fileDatabaseRootPath : string, port : number) {
    await test('Server passes all units', async (t) => {
        const baseURL = `http://localhost:${port}`;
        let server : Server| undefined;

        await t.test('Server can be initialized', async (t) => {
            // Act 
            server = await Server.build(fileDatabaseRootPath, port);

            // Assert
            assert(server, 'Server is undefined');
        });
        
        await t.test('Server responds to endpoints', async (t) => {

            await t.test('Server View API passes all units', async (t) => {

                await t.test('View API responds to /img/test', async (t) => {
                    // Act
                    let res = await fetch(baseURL + '/img/test');
                    const media = await res.json() as ImageBinaryDto;
                        
                    // Assert
                    assert.strictEqual(res.status, 200);
                    assert.strictEqual(media === undefined, false, 'ImageBinaryDto is undefined');
                    assert.strictEqual(media.size > 0, true, 'ImageBinaryDto size is not above 0');
                    assert.strictEqual(media.size, testPngBytes.length, 'ImageBinaryDto size is not equal to testPngBytes length');
                    assert.strictEqual(media.mime, 'image/png', 'ImageBinaryDto mime is not image/png');
                    assert.strictEqual(media.aspectRatio, 1.0, 'ImageBinaryDto aspectRatio is not 1.0');
                });
            });

            await t.test('Server Manage API passes all units', async (t) => {
                
                await t.test('Manage API reject with no auth header', async (t) => {
                    // Arrange
                    let req : RequestInit = { 
                        method : 'POST',
                        headers : {
                            'Content-Type' : 'application/json'
                        },
                        body : JSON.stringify(await getMediaBinary('test.png', MediaVaultType.Image, {buffer: Buffer.from(testPngBytes), size: testPngBytes.length, extension: '.png', aspectRatio: 1.0}))
                    }

                    await t.test('Manage API with no auth header on valid endpoint -> 403 empty body', async (t) => {
                        // Act
                        const res = await fetch(baseURL + '/manage/img/nope', req);
                        const bytes = Buffer.from(await res.arrayBuffer());
                        
                        // Assert
                        assert.strictEqual(res.status, 403);
                        assert.strictEqual(bytes.length, 0, 'Body was not of length zero');
                    });
                    
                    await t.test('Manage API with no auth header on INvalid endpoint -> 403 empty body', async (t) => {
                        // Act
                        const res = await fetch(baseURL + '/manage/FAKE/test', req);
                        const bytes = Buffer.from(await res.arrayBuffer());
                        
                        // Assert
                        assert.strictEqual(res.status, 403);
                        assert.strictEqual(bytes.length, 0, 'Body was not of length zero');
                    });
                });
                
                await t.test('Manage API reject with invalid auth header', async (t) => {
                    // Arrange
                    let req : RequestInit = { 
                        method : 'POST',
                        headers : {
                            'Content-Type' : 'application/json',
                            'ApiKey' : 'INVALID_KEY'
                        },
                        body : JSON.stringify(await getMediaBinary('test.png', MediaVaultType.Image, {buffer: Buffer.from(testPngBytes), size: testPngBytes.length, extension: '.png', aspectRatio: 1.0}))
                    }
                    
                    await t.test('Manage API with bad auth header on valid endpoint -> 403 empty body', async (t) => {
                        // Act
                        const res = await fetch(baseURL + '/manage/img/test', req);
                        const bytes = Buffer.from(await res.arrayBuffer());
                        
                        // Assert
                        assert.strictEqual(res.status, 403);
                        assert.strictEqual(bytes.length, 0, 'Body was not of length zero');
                    });
                    
                    await t.test('Manage API with bad auth header on INvalid endpoint -> 403 empty body', async (t) => {
                        // Act
                        const res = await fetch(baseURL + '/manage/FAKE/test', req);
                        const bytes = Buffer.from(await res.arrayBuffer());
                        
                        // Assert
                        assert.strictEqual(res.status, 403);
                        assert.strictEqual(bytes.length, 0, 'Body was not of length zero');
                    });
                });
                
                await t.test('Manage API accept POST with valid auth header', async (t) => {
                    // Arrange
                    let secrets = JSON.parse(await fetchJSON(`./.secrets/manager.json`)) as APIKeySet;
                    let secret = secrets['APIKeys'][0]; // get the valid key
                    
                    let media = await getMediaBinaryDto('test.png', MediaVaultType.Image, {buffer: Buffer.from([]), size: 0, extension: '.png', aspectRatio: 1.0});

                    let req : RequestInit = { 
                        method : 'POST',
                        headers : {
                            'Content-Type' : 'application/json',
                            'ApiKey' : secret                            
                        },
                        body : JSON.stringify(media)
                    };

                    await t.test('Manage API with good auth header on INvalid endpoint -> 404 empty body', async (t) => {
                        // Act
                        const res = await fetch(baseURL + '/manage/FAKE/test', req);
                        const bytes = Buffer.from(await res.arrayBuffer());
                        
                        // Assert
                        assert.strictEqual(res.status, 404);
                        assert.strictEqual(bytes.length, 0, 'Body was not of length zero');
                    });
                    
                    await t.test('Manage API with good auth header on valid endpoint -> 200', async (t) => {
                        // Act
                        const res = await fetch(baseURL + '/manage/img/test', req);
                        const bytes = Buffer.from(await res.arrayBuffer());
                        
                        // Assert
                        assert.strictEqual(res.status, 200);
                        assert.strictEqual(bytes.length, 0, 'Body was not of length zero');
                    });
                });

                await t.test('Manage API accept GET with valid auth header', async (t) => {
                    // Arrange
                    let secrets = JSON.parse(await fetchJSON(`./.secrets/manager.json`)) as APIKeySet;
                    let secret = secrets['APIKeys'][0]; // get the valid key

                    let req : RequestInit = { 
                        method : 'GET',
                        headers : {
                            'Content-Type' : 'application/json',
                            'ApiKey' : secret         
                        }
                    };

                    await t.test('Manage API GET with good auth header on valid endpoint -> 200', async (t) => {
                        // Act
                        const res = await fetch(baseURL + '/manage/img/test', req);
                        const media = await res.json() as ImageBinaryDto;
                        
                        // Assert
                        assert.strictEqual(res.status, 200);
                        assert.strictEqual(media === undefined, false, 'ImageBinaryDto is undefined');
                        assert.strictEqual(media.size > 0, true, 'ImageBinaryDto size is not above 0');
                        assert.strictEqual(media.size, testPngBytes.length, 'ImageBinaryDto size is not equal to testPngBytes length');
                        assert.strictEqual(media.mime, 'image/png', 'ImageBinaryDto mime is not image/png');
                        assert.strictEqual(media.aspectRatio, 1.0, 'ImageBinaryDto aspectRatio is not 1.0');
                    });
                });
            });
        });

        // Final cleanup on initialized server
        server?.server.close();
    });
}