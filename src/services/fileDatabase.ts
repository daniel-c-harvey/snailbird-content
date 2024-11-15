import { MediaBinary } from '../models/mediaModel.js';
import { putObject } from '../utils/fileDatabase.utils.js';
import { IndexDirectory } from './indexDirectory.js';
import { DirectoryVault, MediaVault, Vault } from './vault.js';

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
            for (const vaultKey of this.index.entryKeys) {
                await this.initVault(vaultKey, new MediaVault());
            }
        }
    }
    
    protected async initVault(vaultKey : string, vault : Vault) {
        const path = this.rootPath + '/' + vaultKey;
        let dvault = await DirectoryVault.from(path, vault);
        
        if (dvault.index !== undefined) {
            this.vaults.set(dvault.index.vaultKey, dvault);
        }
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