import { promises as fs, ReadStream } from 'fs';
import { FileHandle } from 'fs/promises';
import * as Path from 'path';
import { MediaBinary, ImageBinary } from '../models/mediaModel.js';
import { LinkedList } from '../utils/adt.js';
import { Buffer } from 'buffer';

function loadIndex(vaultKey : string) {
    return loadIndex(vaultKey).then((vault) => {
        
    })
}

async function loadIndexAsync(vaultKey : string) : Promise<VaultIndex | undefined>
{
    let indexFH = undefined;
    
    try { indexFH = fs.open(vaultKey + '/index', 'r+'); } 
    catch (e : unknown) { }

    return new Promise((resolve, reject) => {
        // load the index file, and throw an error if there isn't one
        if (indexFH !== undefined) {
            resolve({ id : 0, uriKey : vaultKey, fileHashes : new Set<string>() });;
        } else {
            reject(undefined);
        }
    });
}

abstract class IndexDirectory {
    rootPath : string;
    index : VaultIndex;

    constructor(rootPath : string) {
        this.rootPath = rootPath;
        var index = loadIndex(rootPath);
        if (index !== undefined) {
            this.index = index;
        } else {
            throw Error("Cannot open indexed directory.");
        }
    }
}

export class FileDatabase extends IndexDirectory
{
    vaults : Map<string, DirectoryVault>;
    
    constructor(rootPath : string)
    {
        super(rootPath);
        this.vaults = new Map<string, DirectoryVault>();
        
        // todo load vaults
        // open vault behavior that validates the vault index before loading the vault into the set.
        this.loadVault('img', new ImageVault());
        // this.loadVault('aud', new AudioVault());
    }

    loadResource(vaultKey : string, path : string): Promise<MediaBinary> | undefined {
        let dvault : DirectoryVault | undefined = this.vaults.get(vaultKey);
        if (dvault !== undefined)
        {
            let vault : Vault | undefined = dvault.vault;
            if (vault !== undefined)
            {
                return vault.getMediaAsync(this.rootPath + '/' + dvault.rootPath + '/' + path);
            }
        }
        return undefined;
    }

    loadVault(vaultKey : string, vault : Vault) {
        let dvault = new DirectoryVault(vaultKey, vault);
        if (dvault !== undefined) {
            this.vaults.set(this.rootPath + '/' + dvault.index.uriKey, dvault);
        }
    }
}

class DirectoryVault extends IndexDirectory {
    vault : Vault;

    constructor(rootPath : string, vault : Vault) {
        super(rootPath);
        this.vault = vault;
    }
    
}

interface VaultIndex {
    id : number;
    uriKey : string;
    fileHashes : Set<string>;
}

abstract class Vault {
    async getMediaAsync(mediaPath: string): Promise<MediaBinary> {
        try {        
            const fileHandle : FileHandle = await fs.open(mediaPath, 'r');
            const fr : ReadStream = fileHandle.createReadStream();
    
            return new Promise<MediaBinary>((resolve) =>
            {
                let size = 0;
                const chunks = new LinkedList<Buffer>();
    
                fr.on('data', (chunk : Buffer) => {
                    chunks.add(chunk);
                });
    
                fr.on('end', () => {
                    // close the stream;
                    fr.close();
    
                    // calculate the total size in bytes of all chunks
                    chunks.apply( (data : Buffer) => size += data.byteLength );
                    
                    // allocate and copy the chunk buffers
                    let offset = 0;
                    let bytes = Buffer.alloc(size);
                    chunks.apply((data : Buffer) => {
                        var index;
                        for (index = 0; index < data.byteLength; index++) {
                            bytes[offset + index] = data[index];
                        }
                        offset += data.byteLength;
                    });

                    resolve({
                        buffer: bytes,
                        size: bytes.length
                    });
                });
            });
        } catch (error) {
            throw new Error(`Failed to load image: ${(error as Error).message}`);
        }
    }
}

export class ImageVault extends Vault {
    override async getMediaAsync(mediaPath: string): Promise<ImageBinary> {
        const extension = Path.extname(mediaPath);
        let mediaBinary = await super.getMediaAsync(mediaPath);

        return new Promise<ImageBinary>(
            resolve => resolve(
            {
                'buffer' : mediaBinary.buffer,
                'size' : mediaBinary.size,
                'extension' : extension
            }
        ));
    }
}