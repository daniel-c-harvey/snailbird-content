export interface Index {
    getKey() : string;
    getEntries() : string[];
    getEntriesSize(): number;
    hasEntry(entryKey: string): boolean;
}

export class IndexData {
    indexKey: string;

    constructor(indexKey : string) {
        this.indexKey = indexKey;
    }
}

export class DirectoryIndexData extends IndexData {
    entries : Set<string>;

    constructor(indexKey : string) {
        super(indexKey);
        this.entries = new Set<string>();
    }
}

export class VaultIndexData extends IndexData {
    entries : Map<string, string>;

    constructor(indexKey : string) {
        super(indexKey);
        this.entries = new Map<string, string>();
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
    getEntries(): string[] {
        return Array.from(this.entries);
    }
    getEntriesSize(): number {
        return this.entries.size;
    }
    hasEntry(entryKey: string): boolean {
        return this.entries.has(entryKey);
    }
    putEntry(entryKey : string) {
        this.entries.add(entryKey);
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
    getEntries(): string[] {
        return Array.from(this.entries.keys());
    }
    getEntriesSize(): number {
        return this.entries.size;
    }
    hasEntry(entryKey: string): boolean {
        return this.entries.has(entryKey);
    }
    getEntry(entryKey : string) {
        return this.entries.get(entryKey);
    }
    putEntry(entryKey : string, mediaPath : string) {
        this.entries.set(entryKey, mediaPath);
    }
}
