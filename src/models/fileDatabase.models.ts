import { MediaVaultType } from "./mediaModelFactory.js";

export type EntryKey = { key : string; type : MediaVaultType };

export type MetaData = {
    mediaKey : string;
    extension : string; 
};

export type ImageMetaData = MetaData & {
    aspectRatio : number;
}

export interface Index {
    getKey() : string;
    getEntries() : EntryKey[];
    getEntriesSize(): number;
    hasEntry(entryKey: EntryKey): boolean;
}

export class IndexData {
    indexKey: string;

    constructor(indexKey : string) {
        this.indexKey = indexKey;
    }
}

export class DirectoryIndexData extends IndexData {
    entries : Set<EntryKey>;

    constructor(indexKey : string) {
        super(indexKey);
        this.entries = new Set<EntryKey>();
    }
}

export class DirectoryIndex extends DirectoryIndexData implements Index {
    
    constructor(indexData : DirectoryIndexData) {
        super(indexData.indexKey);
        this.entries = indexData.entries;
    }
        
    getKey(): string {
        return this.indexKey;
    }
    getEntries(): EntryKey[] {
        return Array.from(this.entries);
    }
    getEntriesSize(): number {
        return this.entries.size;
    }
    hasEntry(entryKey: EntryKey): boolean {
        return this.entries.has(entryKey);
    }
    putEntry(entryKey : EntryKey) {
        this.entries.add(entryKey);
    }
}

export class VaultIndexData extends IndexData {
    entries : Map<EntryKey, MetaData>;

    constructor(indexKey : string) {
        super(indexKey);
        this.entries = new Map<EntryKey, MetaData>();
    }
}

export class VaultIndex extends VaultIndexData implements Index {
    
    constructor(indexData : VaultIndexData) {
        super(indexData.indexKey)
        this.entries = indexData.entries;
    }

    getKey(): string {
        return this.indexKey;
    }
    getEntries(): EntryKey[] {
        return Array.from(this.entries.keys());
    }
    getEntriesSize(): number {
        return this.entries.size;
    }
    hasEntry(entryKey: EntryKey): boolean {
        return this.entries.has(entryKey);
    }
    getEntry(entryKey : EntryKey) {
        return this.entries.get(entryKey);
    }
    putEntry(entryKey : EntryKey, metaData : MetaData) {
        this.entries.set(entryKey, metaData);
    }
}
