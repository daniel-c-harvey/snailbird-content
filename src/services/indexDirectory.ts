import path from "path";
import { VaultIndex } from "../models/fileDatabase.models.js";
import { putObject } from "../utils/fileDatabase.utils.js";
import { vaultExists } from "../utils/fileDatabase.utils.js";
import { makeVaultDirectory } from "../utils/fileDatabase.utils.js";
import { fetchObject } from "../utils/fileDatabase.utils.js";

export abstract class IndexDirectory {
    rootPath : string;
    index : VaultIndex | undefined;

    protected constructor(rootPath : string) {
        this.rootPath = rootPath;
    }

    // Attempt to load the index for the directory.  
    // If loading the index fails for any reason, a new index is created.
    async loadIndexAsync() : Promise<VaultIndex | undefined>
    {
        let index : VaultIndex;

        try { 
            index = await fetchObject(this.rootPath + '/index');
        } 
        catch (e : unknown) { // Failed to open existing index
            index = await this.createIndex();
        }

        if (index != undefined) {
            this.index = index;
        }

        return index;
    }

    

    protected async createIndex() : Promise<VaultIndex> {
        
        const index = {
            uriKey: this.getKey(),
            fileKeys: new Set<string>()
        };

        if (!await vaultExists(this.rootPath)) {
            await makeVaultDirectory(this.rootPath);
        }

        await this.writeIndex(this.rootPath, index);

        return index;
    }

    protected async writeIndex(path: string, index: VaultIndex) {
        await putObject(path + '/index', index);
    }

    protected getKey() : string {
        return path.basename(this.rootPath);
    }
}
