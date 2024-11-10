import { promises as fs, ReadStream } from 'fs';
import { FileHandle } from 'fs/promises';
import * as Path from 'path';
import { MediaBinary, ImageBinary } from '../models/mediaModel.js';
import { LinkedList } from '../utils/adt.js';
import { Buffer } from 'buffer';

export class FileDatabase 
{
    rootPath : string;
    vaults : Map<string, DirectoryVault>;
    
    constructor(rootPath : string)
    {
        this.rootPath = rootPath;
        this.vaults = new Map<string, DirectoryVault>();
        
        // todo load vaults
        // open vault behavior that validates the vault index before loading the vault into the set.
        let imgVault = new DirectoryVault("img", new ImageVault());
        this.vaults.set(imgVault.index.uriKey, imgVault);
    }

    loadVaultResource(vaultKey : string, path : string): Promise<MediaBinary> | undefined {
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
}

class DirectoryVault {
    rootPath : string;
    index : VaultIndex;
    vault : Vault;

    constructor(rootPath : string, vault : Vault) {
        this.rootPath = rootPath;
        this.index = loadIndex();
        this.vault = vault;
    }
    
}

interface VaultIndex {
    id : number;
    uriKey : string;
    fileHashes : Set<string>;
}

function loadIndex() : VaultIndex
{
    // load the index file, and throw an error if there isn't one
    return { id : 0, uriKey : "img", fileHashes : new Set<string>() };
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