import { extname } from "path";
import { IndexDirectory, IndexFactory } from "./indexDirectory.js";
import { ImageBinary, MediaBinary } from "../models/mediaModel.js";
import { VaultIndex } from "../models/fileDatabase.models.js";
import { fetchFile, putFile } from "../utils/fileDatabase.utils.js";

export class DirectoryVault extends IndexDirectory {
    vault : Vault;

    static async from(rootPath : string, vault : Vault) : Promise<DirectoryVault | undefined> {
        const factory = new IndexFactory(rootPath);
        let index = await factory.buildIndex();

        if (index !== undefined) {
            return new DirectoryVault(rootPath, index, vault);
        }
         
        return undefined;
    }

    private constructor(rootPath : string, index : VaultIndex, vault : Vault) {
        super(rootPath, index);
        this.vault = vault;
    }
    
    async addEntry(entryKey : string, media : MediaBinary) : Promise<void> {
        this.vault.addMediaAsync(`${this.rootPath}/${entryKey}`, media);
        this.index?.entryKeys.add(entryKey);
    }

    async getEntry(entryKey : string) : Promise<MediaBinary | undefined> {
        if (this.index.entryKeys.has(entryKey)) {
            let bmedia : MediaBinary = await fetchFile(this.rootPath + '/' + entryKey);
            return bmedia;
        }

        return undefined;
    }

}

export abstract class Vault {
    async getMediaAsync(mediaPath: string): Promise<MediaBinary> {
        return fetchFile(mediaPath);
    }

    async addMediaAsync(mediaPath: string, media : MediaBinary) : Promise<void> {
        return putFile(mediaPath, media.buffer);
    }
}

export class MediaVault extends Vault {
    override async getMediaAsync(mediaPath: string): Promise<ImageBinary> {
        const extension = extname(mediaPath);
        let mediaBinary = await super.getMediaAsync(mediaPath);

        return new Promise<ImageBinary>(
            resolve => resolve(
            {
                buffer : mediaBinary.buffer,
                size : mediaBinary.size,
                extension : extension
            }
        ));
    }
}