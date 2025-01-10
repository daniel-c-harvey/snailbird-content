import { extname } from "path";
import { IndexDirectory, IndexFactory } from "./indexDirectory.js";
import { ImageBinary, MediaBinary } from "../models/mediaModel.js";
import { VaultIndex } from "../models/fileDatabase.models.js";
import { fetchFile, putFile } from "../utils/file.js";

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
        await this.addToIndex(entryKey);
        await this.vault.addMediaAsync(`${this.rootPath}/${entryKey}`, media);
    }

    async getEntry(entryKey : string) : Promise<MediaBinary | undefined> {
        if (this.hasIndexEntry(entryKey)) {
            let bmedia : MediaBinary = await fetchFile(this.rootPath + '/' + entryKey);
            return bmedia;
        }

        return undefined;
    }

}

export abstract class Vault {
    async getMediaAsync(mediaPath: string): Promise<MediaBinary> {
        return await fetchFile(mediaPath);
    }

    async addMediaAsync(mediaPath: string, media : MediaBinary) : Promise<void> {
        return await putFile(mediaPath, media.buffer);
    }
}

export class MediaVault extends Vault {
    override async getMediaAsync(mediaPath: string): Promise<ImageBinary> {
        const extension = extname(mediaPath);
        let mediaBinary = await super.getMediaAsync(mediaPath);

        return {
            buffer : mediaBinary.buffer,
            size : mediaBinary.size,
            extension : extension
        }
    }
}