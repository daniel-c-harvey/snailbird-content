export class StructuralMap<K, V> implements Iterable<[K, V]> {
    private innerMap = new Map<string, { key: K; value: V }>();

    /**
     * Converts a key to its string representation for comparison
     */
    private getKeyString(key: K): string {
        if (typeof key === 'string') return key;
        if (typeof key === 'number') return key.toString();
        if (key === null) return 'null';
        if (key === undefined) return 'undefined';
        
        // For objects (including EntryKey), stringify for structural comparison
        // You might want to customize this based on your EntryKey structure
        return JSON.stringify(key);
    }

    set(key: K, value: V): this {
        const keyString = this.getKeyString(key);
        this.innerMap.set(keyString, { key, value });
        return this;
    }

    get(key: K): V | undefined {
        const keyString = this.getKeyString(key);
        return this.innerMap.get(keyString)?.value;
    }

    has(key: K): boolean {
        const keyString = this.getKeyString(key);
        return this.innerMap.has(keyString);
    }

    delete(key: K): boolean {
        const keyString = this.getKeyString(key);
        return this.innerMap.delete(keyString);
    }

    clear(): void {
        this.innerMap.clear();
    }

    get size(): number {
        return this.innerMap.size;
    }

    // Implement iterators to make it work with for...of loops
    *[Symbol.iterator](): IterableIterator<[K, V]> {
        for (const { key, value } of this.innerMap.values()) {
            yield [key, value];
        }
    }

    *entries(): IterableIterator<[K, V]> {
        yield* this[Symbol.iterator]();
    }

    *keys(): IterableIterator<K> {
        for (const { key } of this.innerMap.values()) {
            yield key;
        }
    }

    *values(): IterableIterator<V> {
        for (const { value } of this.innerMap.values()) {
            yield value;
        }
    }

    forEach(callbackfn: (value: V, key: K, map: StructuralMap<K, V>) => void): void {
        for (const [key, value] of this) {
            callbackfn(value, key, this);
        }
    }
}

