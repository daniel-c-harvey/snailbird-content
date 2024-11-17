import { MediaBinary } from '../models/mediaModel.js';
import { IndexDirectory, IndexFactory } from './indexDirectory.js';
import { DirectoryVault, MediaVault, Vault } from './vault.js';
import { VaultIndex } from '../models/fileDatabase.models.js';
import { putObject } from '../utils/fileDatabase.utils.js';
import { resolve } from 'path';

export class FileDatabase extends IndexDirectory
{
    private vaults : Map<string, DirectoryVault>;
    
    static async from(rootPath : string) : Promise<FileDatabase | undefined> {
        const factory = new IndexFactory(rootPath);
        let index = await factory.buildIndex();
        
        if (index !== undefined) {
            let db = new FileDatabase(rootPath, index);
            await db.initVaults();
            return db;
        }

        return undefined;
    }

    protected constructor(rootPath : string, index : VaultIndex)
    {
        super(rootPath, index);
        this.vaults = new Map<string, DirectoryVault>();
    }

    protected async initVaults() {
        if (this.index !== undefined) {
            for (const vaultKey of this.index.entryKeys) {
                await this.initVault(vaultKey, new MediaVault());
            }
        }
    }
    
    protected async initVault(vaultKey : string, vault : Vault) {
        const path = this.rootPath + '/' + vaultKey;
        let dvault = await DirectoryVault.from(path, vault);
        
        if (dvault?.index !== undefined) {
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

            if (dvault !== undefined) {
                this.vaults.set(vaultKey, dvault);
                await this.addToIndex(vaultKey);
            }
        } catch (e) {
            throw e;
        }
    }    

    async loadResource(vaultKey : string, entryKey : string): Promise<MediaBinary | undefined> {
        let dvault : DirectoryVault | undefined = this.vaults.get(vaultKey);

        if (dvault !== undefined)
        {
            return await dvault.vault.getMediaAsync(dvault.rootPath + '/' + entryKey);
        }
        return undefined;
    }

    async registerResource(vaultKey : string, mediaKey: string, media : MediaBinary) : Promise<boolean> {
        let dvault = this.vaults.get(vaultKey);

        if (dvault !== undefined) {
            try {
                return dvault.addEntry(mediaKey, media)
                .then(() => true,
                      () => false)
            }
            catch (e) { }
        }
        return false;
    }
}