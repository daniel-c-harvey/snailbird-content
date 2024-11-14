import { extname } from "path";
import { IndexDirectory } from "./indexDirectory.js";
import { fetchFile, putFile } from "../utils/fileDatabase.utils.js";
import { ImageBinary, MediaBinary } from "../models/mediaModel.js";

export class DirectoryVault extends IndexDirectory {
    vault : Vault;

    static async from(rootPath : string, vault : Vault) : Promise<DirectoryVault> {
        let dv = new DirectoryVault(rootPath, vault);
        await dv.loadIndexAsync();
        return new Promise<DirectoryVault>(resolve => resolve(dv));
    }

    private constructor(rootPath : string, vault : Vault) {
        super(rootPath);
        this.vault = vault;
    }

}

export abstract class Vault {
    async getMediaAsync(mediaPath: string): Promise<MediaBinary> {
        return fetchFile(mediaPath);
    }

    async addMediaAsync(mediaPath: string, media : MediaBinary) : Promise<void> {
        return putFile(mediaPath, media.buffer)
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