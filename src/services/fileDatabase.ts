import { DirectoryIndexDirectory, IndexFactory, IndexType } from './index.js';
import { MediaVault, ImageDirectoryVault } from './vault.js';
import { DirectoryIndex, EntryKey } from '../models/fileDatabase.models.js';
import { MediaVaultType, MediaVaultTypeMap } from '../models/mediaModelFactory.js';
import { StructuralMap } from '../utils/StructuralMap.js';

export class FileDatabase extends DirectoryIndexDirectory
{
    private vaults : StructuralMap<EntryKey, MediaVault>
    
    static async from(rootPath : string) : Promise<FileDatabase | undefined> {
        const factory = new IndexFactory(rootPath, IndexType.Directory);
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
        super(rootPath, IndexType.Directory, index);
        this.vaults = new StructuralMap<EntryKey, MediaVault>();
    }

    protected async initVaults() {
        for (const vaultKey of this.getIndexEntries()) {
            await this.initVault(vaultKey);
        }
    }
    
    protected async initVault(vaultKey : EntryKey) {
        const path = this.rootPath + '/' + vaultKey.key;
        let directoryVault = await ImageDirectoryVault.from(path);
        
        if (directoryVault !== undefined) {
            this.vaults.set(vaultKey, directoryVault);
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
            let directoryVault = await ImageDirectoryVault.from(path);

            if (directoryVault !== undefined) {
                this.vaults.set(vaultKey, directoryVault);
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
            let directoryVault = this.vaults.get(vaultKey);
            if (directoryVault !== undefined) {
                await directoryVault.addEntry(vk, entryKey, media)
                return true;
            }
        } catch (e) { }
        return false;
    }
}