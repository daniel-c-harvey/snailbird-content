import path, { extname } from 'path';
import { MediaBinary, ImageBinary } from '../models/mediaModel.js';
import { VaultIndex} from '../models/fileDatabase.models.js'
import { fetchFile, fetchObject, makeVaultDirectory, putFile, putObject, vaultExists } from '../utils/fileDatabase.utils.js';

abstract class IndexDirectory {
    rootPath : string;
    index : VaultIndex | undefined;

    protected constructor(rootPath : string) {
        this.rootPath = rootPath;
    }

    // Attempt to load the index for the directory.  
    // If loading the index fails for any reason, a new index is created.
    async loadIndexAsync() : Promise<VaultIndex | undefined>
    {
        let index : VaultIndex;

        try { 
            index = await fetchObject(this.rootPath + '/index');
        } 
        catch (e : unknown) { // Failed to open existing index
            index = await this.createIndex();
        }

        if (index != undefined) {
            this.index = index;
        }

        return index;
    }

    

    protected async createIndex() : Promise<VaultIndex> {
        
        const index = {
            uriKey: this.getKey(),
            fileKeys: new Set<string>()
        };

        if (!await vaultExists(this.rootPath)) {
            await makeVaultDirectory(this.rootPath);
        }

        await this.writeIndex(this.rootPath, index);

        return index;
    }

    protected async writeIndex(path: string, index: VaultIndex) {
        await putObject(path + '/index', index);
    }

    protected getKey() : string {
        return path.basename(this.rootPath);
    }
}

export class FileDatabase extends IndexDirectory
{
    private vaults : Map<string, DirectoryVault>;
    
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

        if (this.index !== undefined) {
            for (const vaultKey of this.index.fileKeys) {
                await this.initVault(vaultKey, new MediaVault());
            }
        }

        // this.loadVault('aud', new AudioVault());
    }

    hasVault(vaultKey : string) : boolean {
        return this.vaults.has(vaultKey)
    }

    getVault(vaultKey : string) : DirectoryVault | undefined {
        return this.vaults.get(vaultKey);
    }

    async createVault(vaultKey : string, vault : Vault) {
        try {
            let path = this.rootPath + '/' + vaultKey;

            let dvault = await DirectoryVault.from(path, vault);
            this.vaults.set(vaultKey, dvault);
            await this.addToIndex(vaultKey);
        } catch (e) {
            console.log("Could not create vault.");
            throw e;
        }
    }

    private async addToIndex(vaultKey: string) {
        if (this.index !== undefined) {
            this.index.fileKeys.add(vaultKey);
            await this.writeIndex(this.rootPath, this.index);
        }
    }

    protected async initVault(vaultKey : string, vault : Vault) {
        const path = this.rootPath + '/' + vaultKey;
        let dvault = await DirectoryVault.from(path, vault);
        
        if (dvault.index !== undefined) {
            this.vaults.set(dvault.index.uriKey, dvault);
        }
    }

    async loadResource(vaultKey : string, path : string): Promise<MediaBinary | undefined> {
        let dvault : DirectoryVault | undefined = this.vaults.get(vaultKey);

        if (dvault !== undefined)
        {
            let vault : Vault | undefined = dvault.vault;

            if (vault !== undefined)
            {
                return await vault.getMediaAsync(this.rootPath + '/' + dvault.rootPath + '/' + path);
            }
        }
        return undefined;
    }

    async registerResource(vaultKey : string, media : MediaBinary) : Promise<boolean> {
        let dvault = this.vaults.get(vaultKey);

        if (dvault !== undefined) {
            try {
                // implement directory vault registration
                await putObject(this.rootPath + '/' + vaultKey, media); 
                
                return true;
            }
            catch (e) { }
        }
        return false;
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

abstract class Vault {
    async getMediaAsync(mediaPath: string): Promise<MediaBinary> {
        return fetchFile(mediaPath);
    }

    async addMediaAsync(mediaPath: string, media : MediaBinary) : Promise<void> {
        return putFile(mediaPath, media.buffer)
    }
}

export class MediaVault extends Vault {
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