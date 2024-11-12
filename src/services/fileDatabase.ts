import { extname } from 'path';
import { MediaBinary, ImageBinary } from '../models/mediaModel.js';
import { fetchFile, fetchObject, makeVaultDirectory, putObject, vaultDirectoryExists } from './fileDatabase.system.js';

abstract class IndexDirectory {
    rootPath : string;
    index : VaultIndex | undefined;

    protected constructor(rootPath : string) {
        this.rootPath = rootPath;
    }

    // Attempt to load the index for the specified vault.  
    // If loading the index fails for any reason, a new index is created.
    async loadIndexAsync() : Promise<VaultIndex | undefined>
    {        
        const path = this.rootPath + '/index';
        let index : VaultIndex;

        try { 
            index = await fetchObject(path);
        } 
        catch (e : unknown) { // Failed to open existing index
            console.log(`Creating Index for ${this.rootPath}.`);
            
            index = { 
                uriKey : this.rootPath, 
                fileHashes : new Set<string>()
            };

            if (! await vaultDirectoryExists(this.rootPath)) {
                await makeVaultDirectory(this.rootPath);
            } 
            
            await putObject(path, index);
        }

        return new Promise(resolve => {
            resolve(index);
        });
    }
}

export class FileDatabase extends IndexDirectory
{
    vaults : Map<string, DirectoryVault>;
    
    static async from(rootPath : string) : Promise<FileDatabase> {
        let db = new FileDatabase(rootPath);
        await db.initVaults();
        return db;
    }

    protected constructor(rootPath : string)
    {
        super(rootPath);
        this.vaults = new Map<string, DirectoryVault>();
    }

    protected async initVaults() {
        this.index = await this.loadIndexAsync();

        await this.initVault('img', new ImageVault());
        // this.loadVault('aud', new AudioVault());
    }

    protected async initVault(vaultKey : string, vault : Vault) {
        const path = this.rootPath + '/' + vaultKey;
        let dvault = await DirectoryVault.from(path, vault);
        
        if (dvault.index !== undefined) {
            this.vaults.set(dvault.index.uriKey, dvault);
        }
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
}

class DirectoryVault extends IndexDirectory {
    vault : Vault;

    static async from(rootPath : string, vault : Vault) : Promise<DirectoryVault> {
        let dv = new DirectoryVault(rootPath, vault);
        await dv.loadIndexAsync();
        return new Promise<DirectoryVault>(resolve => resolve(dv));
    }

    private constructor(rootPath : string, vault : Vault) {
        super(rootPath);
        this.vault = vault;
    }
}

interface VaultIndex {
    uriKey : string;
    fileHashes : Set<string>;
}

abstract class Vault {
    async getMediaAsync(mediaPath: string): Promise<MediaBinary> {
        return fetchFile(mediaPath);
    }
}

export class ImageVault extends Vault {
    override async getMediaAsync(mediaPath: string): Promise<ImageBinary> {
        const extension = extname(mediaPath);
        let mediaBinary = await super.getMediaAsync(mediaPath);

        return new Promise<ImageBinary>(
            resolve => resolve(
            {
                buffer : mediaBinary.buffer,
                size : mediaBinary.size,
                extension : extension
            }
        ));
    }
}