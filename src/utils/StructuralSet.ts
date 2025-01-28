export class StructuralSet<T> implements Iterable<T> {
    private innerMap = new Map<string, T>();

    /**
     * Converts a value to its string representation for comparison
     */
    private getValueString(value: T): string {
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';

        // For objects, stringify for structural comparison
        return JSON.stringify(value);
    }

    add(value: T): this {
        const valueString = this.getValueString(value);
        if (!this.innerMap.has(valueString)) {
            this.innerMap.set(valueString, value);
        }
        return this;
    }

    has(value: T): boolean {
        const valueString = this.getValueString(value);
        return this.innerMap.has(valueString);
    }

    delete(value: T): boolean {
        const valueString = this.getValueString(value);
        return this.innerMap.delete(valueString);
    }

    clear(): void {
        this.innerMap.clear();
    }

    get size(): number {
        return this.innerMap.size;
    }

    // Implement iterators to make it work with for...of loops
    *[Symbol.iterator](): IterableIterator<T> {
        yield* this.innerMap.values();
    }

    *values(): IterableIterator<T> {
        yield* this[Symbol.iterator]();
    }
}
