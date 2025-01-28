import { MediaVaultType } from "./mediaModelFactory.js";
import { StructuralMap } from "../utils/StructuralMap.js";
import { StructuralSet } from "../utils/StructuralSet.js";

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
    entries: EntryKey[];

    constructor(indexKey: string) {
        super(indexKey);
        this.entries = [];
    }

    static fromIndex(index: DirectoryIndex): DirectoryIndexData {
        const data = new DirectoryIndexData(index.getKey());
        data.entries = [...index.entries];
        return data;
    }
}

export class DirectoryIndex extends IndexData implements Index {
    entries: StructuralSet<EntryKey>;
    
    constructor(indexData: DirectoryIndexData) {
        super(indexData.indexKey);
        this.entries = new StructuralSet<EntryKey>();
        // Load entries array into structural set
        for (const entry of indexData.entries) {
            this.entries.add(entry);
        }
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
    putEntry(entryKey: EntryKey) {
        this.entries.add(entryKey);
    }
}

export class VaultIndexData extends IndexData {
    entries: [key: EntryKey, value: MetaData][];

    constructor(indexKey: string) {
        super(indexKey);
        this.entries = [];
    }

    static fromIndex(index: VaultIndex): VaultIndexData {
        const data = new VaultIndexData(index.getKey());
        data.entries = [...index.entries];
        return data;
    }
}

export class VaultIndex extends IndexData implements Index {
    entries: StructuralMap<EntryKey, MetaData>;
    
    constructor(indexData: VaultIndexData) {
        super(indexData.indexKey);
        this.entries = new StructuralMap<EntryKey, MetaData>();
        // Load entries array into structural map
        for (const entry of indexData.entries) {
            this.entries.set(entry[0], entry[1]);
        }
    }

    getKey(): string {
        return this.indexKey;
    }
    getEntries(): EntryKey[] {
        return [...this.entries.keys()];
    }
    getEntriesSize(): number {
        return this.entries.size;
    }
    hasEntry(entryKey: EntryKey): boolean {
        return this.entries.has(entryKey);
    }
    getEntry(entryKey: EntryKey) {
        return this.entries.get(entryKey);
    }
    putEntry(entryKey: EntryKey, metaData: MetaData) {
        this.entries.set(entryKey, metaData);
    }
}
