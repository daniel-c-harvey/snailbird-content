import path from "path";
import { DirectoryIndex, DirectoryIndexData, EntryKey, Index, IndexData, MetaData, VaultIndex, VaultIndexData } from "../models/fileDatabase.models.js";
import { putObject } from "../utils/file.js";
import { makeVaultDirectory } from "../utils/file.js";
import { fetchObject } from "../utils/file.js";

export enum IndexType {
    Directory,
    Vault
}

export type IndexTypeMap = {
    [IndexType.Directory]: DirectoryIndex,
    [IndexType.Vault]: VaultIndex
}

export type IndexDataMap = {
    [IndexType.Directory]: DirectoryIndexData,
    [IndexType.Vault]: VaultIndexData
}

type IndexDataBuilder<T extends IndexType> = (path: string) => IndexDataMap[T];

const indexDataBuilder: { [T in IndexType]: IndexDataBuilder<T> } = {
    [IndexType.Directory]: (path: string): DirectoryIndexData => new DirectoryIndexData(path),
    [IndexType.Vault]: (path: string): VaultIndexData => new VaultIndexData(path)
};

type IndexContainerBuilder<T extends IndexType> = (data: IndexDataMap[T]) => IndexTypeMap[T];

const indexContainerBuilder: { [T in IndexType]: IndexContainerBuilder<T> } = {
    [IndexType.Directory]: (data: DirectoryIndexData) => new DirectoryIndex(data),
    [IndexType.Vault]: (data: VaultIndexData) => new VaultIndex(data)
};

const indexDataConverter: { [T in IndexType]: (index: IndexTypeMap[T]) => IndexDataMap[T] } = {
    [IndexType.Directory]: (index: DirectoryIndex) => DirectoryIndexData.fromIndex(index),
    [IndexType.Vault]: (index: VaultIndex) => VaultIndexData.fromIndex(index)
};

abstract class AbstractIndexContainer<T extends IndexType>  {
    protected type: T;
    rootPath : string;

    constructor(path : string, type: T) {
        this.rootPath = path;
        this.type = type;
    }
    
    getKey() : string {
        return path.basename(this.rootPath);
    }
    
    protected async saveIndex(index: IndexTypeMap[T]) {
        await putObject(this.rootPath + '/index', indexDataConverter[this.type](index));
    }
}

export class IndexFactory<T extends IndexType> extends AbstractIndexContainer<T> {
    constructor(path: string, type: T) {
        super(path, type);
    }

    async buildIndex(): Promise<IndexTypeMap[T] | undefined> {
        try {
            return await this.loadOrCreateIndex();
        } catch (error) {
            return undefined;
        }
    }

    protected async loadOrCreateIndex(): Promise<IndexTypeMap[T]> {
        try {
            return indexContainerBuilder[this.type](await fetchObject(this.rootPath + '/index')) as IndexTypeMap[T];
        } catch (error) {
            return await this.createIndex();
        }
    }

    protected async createIndex(): Promise<IndexTypeMap[T]> {
        const data = indexDataBuilder[this.type](this.rootPath) as IndexDataMap[T];
        const index = indexContainerBuilder[this.type](data) as IndexTypeMap[T];

        await makeVaultDirectory(this.rootPath);
        await this.saveIndex(index);

        return index;
    }
}

export abstract class IndexDirectory<T extends IndexType> extends AbstractIndexContainer<T> {
    protected index : IndexTypeMap[T];

    protected constructor(rootPath : string, type: T, index : IndexTypeMap[T]) {
        super(rootPath, type);
        this.index = index;
    }    

    protected getIndexEntries() : EntryKey[] {
        return this.index.getEntries();
    }

    getIndexSize() : number {
        return this.index.getEntriesSize();
    }

    hasIndexEntry(entryKey : EntryKey) : boolean {
        return this.index.hasEntry(entryKey);
    }    
}

export class DirectoryIndexDirectory extends IndexDirectory<IndexType.Directory> {
    
    protected async addToIndex(entryKey: EntryKey) {
        if (this.index !== undefined) {
            this.index.putEntry(entryKey);
            await this.saveIndex(this.index);
        }
    }
}

export class VaultIndexDirectory extends IndexDirectory<IndexType.Vault> {
    
    protected async addToIndex(entryKey: EntryKey, metaData : MetaData) {
        if (this.index !== undefined) {
            this.index.putEntry(entryKey, metaData);
            await this.saveIndex(this.index);
        }
    }
}