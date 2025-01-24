import { extname } from "path";
import { IndexFactory, VaultIndexDirectory } from "./index.js";
import { FileBinary, ImageBinary, MediaBinary } from "../models/mediaModel.js";
import { VaultIndex, VaultIndexData } from "../models/fileDatabase.models.js";
import { fetchFile, putFile } from "../utils/file.js";
import { stringify } from "querystring";

export class DirectoryVault extends VaultIndexDirectory {
    private vault : MediaVault;

    static async from(rootPath : string, vault : MediaVault) : Promise<DirectoryVault | undefined> {
        const factory = new IndexFactory<VaultIndex, VaultIndexData>(rootPath, (data) => new VaultIndex(data), (path) => new VaultIndexData(path));
        let index = await factory.buildIndex();

        if (index !== undefined) {
            return new DirectoryVault(rootPath, index, vault);
        }
         
        return undefined;
    }

    private constructor(rootPath : string, index : VaultIndex, vault : MediaVault) {
        super(rootPath, index);
        this.vault = vault;
    }
    
    private getMediaKey(entryKey : string, extension : string) : string {
        return `${entryKey.replace(/[^a-zA-Z0-9]/g, '-')}${extension}`;
    }

    private getMediaPathFromEntryKey(entryKey : string, extension : string) : string {
        return `${this.rootPath}/${this.getMediaKey(entryKey, extension)}`;
    }
    
    private getMediaPathFromMediaKey(mediaKey : string) : string {
        return `${this.rootPath}/${mediaKey}`;
    }

    async addEntry(entryKey : string, media : MediaBinary) : Promise<void> {
        await this.addToIndex(entryKey, this.getMediaKey(entryKey, media.extension));
        await this.vault.addMediaAsync(this.getMediaPathFromEntryKey(entryKey, media.extension), media);
    }

    async getEntry(entryKey : string) : Promise<MediaBinary | undefined> {
        if (this.hasIndexEntry(entryKey)) {
            const mediaKey : string | undefined = this.index.getEntry(entryKey);
            if (mediaKey !== undefined) {
                return await this.vault.getMediaAsync(this.getMediaPathFromMediaKey(mediaKey));
            }
        }
        return undefined;
    }
}

export abstract class Vault {
    async getMediaAsync(mediaPath: string): Promise<FileBinary> {
        return await fetchFile(mediaPath);
    }

    async addMediaAsync(mediaPath: string, media : FileBinary) : Promise<void> {
        return await putFile(mediaPath, media.buffer);
    }
}

export class MediaVault extends Vault {
    override async getMediaAsync(mediaPath: string): Promise<MediaBinary> {
        const extension = extname(mediaPath);
        let fileBinary = await super.getMediaAsync(mediaPath);
        return new MediaBinary(fileBinary.buffer, fileBinary.size, extension);
    }
}