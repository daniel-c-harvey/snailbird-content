import { MediaBinary } from '../models/mediaModel.js';
import { DirectoryIndexDirectory, IndexDirectory, IndexFactory } from './index.js';
import { DirectoryVault, MediaVault, Vault } from './vault.js';
import { DirectoryIndex, DirectoryIndexData, VaultIndex } from '../models/fileDatabase.models.js';

export class FileDatabase extends DirectoryIndexDirectory
{
    private vaults : Map<string, DirectoryVault>
    
    static async from(rootPath : string) : Promise<FileDatabase | undefined> {
        const factory = new IndexFactory<DirectoryIndex, DirectoryIndexData>(rootPath, (data) => new DirectoryIndex(data), (path) => new DirectoryIndexData(path));
        let rootIndex = await factory.buildIndex();
        
        if (rootIndex !== undefined) {
            let db = new FileDatabase(rootPath, rootIndex);
            await db.initVaults();
            return db;
        }

        return undefined;
    }

    protected constructor(rootPath : string, index : DirectoryIndex)
    {
        super(rootPath, index);
        this.vaults = new Map<string, DirectoryVault>();
    }

    protected async initVaults() {
        for (const vaultKey of this.getIndexEntries()) {
            await this.initVault(vaultKey, new MediaVault());
        }
    }
    
    protected async initVault(vaultKey : string, vault : MediaVault) {
        const path = this.rootPath + '/' + vaultKey;
        let dvault = await DirectoryVault.from(path, vault);
        
        if (dvault !== undefined) {
            this.vaults.set(dvault.getKey(), dvault);
        }
    }

    hasVault(vaultKey : string) : boolean {
        return this.vaults.has(vaultKey)
    }

    getVault(vaultKey : string) : DirectoryVault | undefined {
        return this.hasIndexEntry(vaultKey) ? this.vaults.get(vaultKey) : undefined;
    }

    async createVault(vaultKey : string, vault : MediaVault) {
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
        try {
            let dvault : DirectoryVault | undefined = this.vaults.get(vaultKey);
            if (dvault !== undefined) {
                return await dvault.getEntry(entryKey);
            }
        } catch (error) { }
        return undefined;
    }

    async registerResource(vaultKey : string, entryKey: string, media : MediaBinary) : Promise<boolean> {
        try {
            let dvault = this.vaults.get(vaultKey);
            if (dvault !== undefined) {
                await dvault.addEntry(entryKey, media)
                return true;
            }
        } catch (e) { }
        return false;
    }
}