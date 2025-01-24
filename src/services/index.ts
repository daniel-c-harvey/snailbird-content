import path from "path";
import { DirectoryIndex, Index, IndexData, VaultIndex } from "../models/fileDatabase.models.js";
import { putObject } from "../utils/file.js";
import { makeVaultDirectory } from "../utils/file.js";
import { fetchObject } from "../utils/file.js";

abstract class AbstractIndexContainer<TIndex extends Index>  {
    rootPath : string;

    constructor(path : string) {
        this.rootPath = path;
    }
    
    getKey() : string {
        return path.basename(this.rootPath);
    }
    
    protected async saveIndex(index: TIndex) {
        await putObject(this.rootPath + '/index', index);
    }
}

export class IndexFactory<TIndex extends Index, TData extends IndexData> extends AbstractIndexContainer<TIndex> {
    private containerFactory : (data : TData) => TIndex;
    private indexFactory : (path : string) => TData;

    constructor(path : string, containerFactory : (data : TData) => TIndex, indexFactory : (path : string) => TData) {
        super(path);
        this.containerFactory = containerFactory;
        this.indexFactory = indexFactory;
    }

    async buildIndex() : Promise<TIndex | undefined> {
        try {
            return await this.loadOrCreateIndex();
        } catch (error) {
            return undefined;
        }
    }

    protected async loadOrCreateIndex() : Promise<TIndex>
    {
        try {
            return this.containerFactory(await fetchObject(this.rootPath + '/index'));
        } catch (error) {
            return await this.createIndex();
        }
    }

    protected async createIndex() : Promise<TIndex> {
        const data = this.indexFactory(this.rootPath);
        const index = this.containerFactory(data);

        await makeVaultDirectory(this.rootPath);
        await this.saveIndex(index);

        return index;
    }
}

export abstract class IndexDirectory<TIndex extends Index> extends AbstractIndexContainer<TIndex> {
    protected index : TIndex;

    protected constructor(rootPath : string, index : TIndex) {
        super(rootPath);
        this.index = index;
    }    

    protected getIndexEntries() : string[] {
        return this.index.getEntries();
    }

    getIndexSize() : number {
        return this.index.getEntriesSize();
    }

    hasIndexEntry(entryKey : string) : boolean {
        return this.index.hasEntry(entryKey);
    }    
}

export class DirectoryIndexDirectory extends IndexDirectory<DirectoryIndex> {
    
    protected async addToIndex(entryKey: string) {
        if (this.index !== undefined) {
            this.index.putEntry(entryKey);
            await this.saveIndex(this.index);
        }
    }
}

export class VaultIndexDirectory extends IndexDirectory<VaultIndex> {
    
    protected async addToIndex(entryKey: string, mediaPath : string) {
        if (this.index !== undefined) {
            this.index.putEntry(entryKey, mediaPath);
            await this.saveIndex(this.index);
        }
    }
}