import path from "path";
import { VaultIndex } from "../models/fileDatabase.models.js";
import { putObject } from "../utils/fileDatabase.utils.js";
import { makeVaultDirectory } from "../utils/fileDatabase.utils.js";
import { fetchObject } from "../utils/fileDatabase.utils.js";

abstract class AbstractIndex {
    rootPath : string;

    constructor(path : string) {
        this.rootPath = path;
    }
    
    getKey() : string {
        return path.basename(this.rootPath);
    }
    
    protected async saveIndex(index: VaultIndex) {
        await putObject(this.rootPath + '/index', index);
    }
}

export class IndexFactory extends AbstractIndex {

    constructor(path : string) {
        super(path);
    }

    async buildIndex() : Promise<VaultIndex | undefined> {
        try {
            return await this.loadOrCreateIndex();
        } catch (error) {
            return undefined;
        }
    }

    protected async loadOrCreateIndex() : Promise<VaultIndex>
    {
        try {
            return await fetchObject(this.rootPath + '/index')
        } catch (error) {
            return await this.createIndex();
        }
    }

    protected async createIndex() : Promise<VaultIndex> {
        
        const index = {
            vaultKey: this.getKey(),
            entryKeys: new Set<string>()
        };

        await makeVaultDirectory(this.rootPath);
        await this.saveIndex(index);

        return index;
    }
}

export abstract class IndexDirectory extends AbstractIndex {
    private index : VaultIndex;

    protected constructor(rootPath : string, index : VaultIndex) {
        super(rootPath);
        this.index = index;
    }

    protected async addToIndex(entryKey: string) {
        if (this.index !== undefined) {
            this.index.entryKeys.add(entryKey);
            await this.saveIndex(this.index);
        }
    }

    protected getIndexEntries() : Set<string>{
        return this.index.entryKeys;
    }

    getIndexSize() : number {
        return this.index.entryKeys.size;
    }

    hasIndexEntry(entryKey : string) : boolean {
        return this.index.entryKeys.has(entryKey);
    }    
}
