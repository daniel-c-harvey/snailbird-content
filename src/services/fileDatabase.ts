import { MediaBinary } from '../models/mediaModel.js';
import { DirectoryIndexDirectory, IndexFactory } from './index.js';
import { MediaVault, ImageDirectoryVault } from './vault.js';
import { DirectoryIndex, DirectoryIndexData, EntryKey } from '../models/fileDatabase.models.js';
import { MediaVaultType, MediaVaultTypeMap } from '../models/mediaModelFactory.js';

export class FileDatabase extends DirectoryIndexDirectory
{
    private vaults : Map<EntryKey, MediaVault>
    
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
        this.vaults = new Map<EntryKey, MediaVault>();
    }

    protected async initVaults() {
        for (const vaultKey of this.getIndexEntries()) {
            await this.initVault(vaultKey);
        }
    }
    
    protected async initVault(vaultKey : EntryKey) {
        const path = this.rootPath + '/' + vaultKey.key;
        let dvault = await ImageDirectoryVault.from(path);
        
        if (dvault !== undefined) {
            this.vaults.set(vaultKey, dvault);
        }
    }

    hasVault(vaultKey : EntryKey) : boolean {
        return this.vaults.has(vaultKey)
    }

    getVault(vaultKey : EntryKey) : MediaVault | undefined {
        return this.hasVault(vaultKey) ? this.vaults.get(vaultKey) : undefined;
    }

    async createVault(vaultKey : EntryKey) {
        try {
            let path = this.rootPath + '/' + vaultKey.key;
            let dvault = await ImageDirectoryVault.from(path);

            if (dvault !== undefined) {
                this.vaults.set(vaultKey, dvault);
                await this.addToIndex(vaultKey);
            }
        } catch (e) {
            throw e;
        }
    }    

    async loadResource<T extends MediaVaultType>(vk : T, vaultKey: EntryKey, entryKey: EntryKey): Promise<MediaVaultTypeMap[T] | undefined> {
        try {
            const vault = this.vaults.get(vaultKey);
            if (vault !== undefined) {
                return await vault.getEntry<T>(vk, entryKey);
            }
        } catch (error) { }
        return undefined;
    }

    async registerResource<T extends MediaVaultType>(vk : T, vaultKey : EntryKey, entryKey: EntryKey, media : MediaVaultTypeMap[T]) : Promise<boolean> {
        try {
            let dvault = this.vaults.get(vaultKey);
            if (dvault !== undefined) {
                await dvault.addEntry(vk, entryKey, media)
                return true;
            }
        } catch (e) { }
        return false;
    }
}