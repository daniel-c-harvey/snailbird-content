import path from "path";
import { VaultIndex } from "../models/fileDatabase.models.js";
import { putObject } from "../utils/fileDatabase.utils.js";
import { vaultExists } from "../utils/fileDatabase.utils.js";
import { makeVaultDirectory } from "../utils/fileDatabase.utils.js";
import { fetchObject } from "../utils/fileDatabase.utils.js";

abstract class AbstractIndex {
    rootPath : string;

    constructor(path : string) {
        this.rootPath = path;
    }
    
    protected getKey() : string {
        return path.basename(this.rootPath);
    }
    
    protected async writeIndex(index: VaultIndex) {
        await putObject(this.rootPath + '/index', index);
    }
}

export class IndexFactory extends AbstractIndex {

    constructor(path : string) {
        super(path);
    }

    async buildIndex() : Promise<VaultIndex | undefined> {
        return this.loadOrCreateIndex()
                .then(
                    index => index,
                    _ => undefined
                );
    }

    protected async loadOrCreateIndex() : Promise<VaultIndex>
    {
        return new Promise<VaultIndex>((resolve, reject) => {
            fetchObject(this.rootPath + '/index')
            .then(
                (index) => resolve(index),
                (_) => {
                    this.createIndex()
                    .then(
                        index => resolve(index),
                        (error) => reject(error)
                    )
                }
            );
        });
    }

    protected async createIndex() : Promise<VaultIndex> {
        
        const index = {
            vaultKey: this.getKey(),
            entryKeys: new Set<string>()
        };

        if (!await vaultExists(this.rootPath)) {
            await makeVaultDirectory(this.rootPath);
        }

        await this.writeIndex(index);

        return index;
    }
}

export abstract class IndexDirectory extends AbstractIndex {
    index : VaultIndex;

    protected constructor(rootPath : string, index : VaultIndex) {
        super(rootPath);
        this.index = index;
    }

    protected async addToIndex(entryKey: string) {
        if (this.index !== undefined) {
            this.index.entryKeys.add(entryKey);
            await this.writeIndex(this.index);
        }
    }
}
