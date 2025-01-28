import { extname } from "path";
import { IndexFactory, IndexType, VaultIndexDirectory } from "./index.js";
import { FileBinary, ImageBinary, ImageBinaryParams, MediaBinary, MediaBinaryParams } from "../models/mediaModel.js";
import { EntryKey, ImageMetaData, MetaData, VaultIndex, VaultIndexData } from "../models/fileDatabase.models.js";
import { fetchFile, putFile } from "../utils/file.js";
import { FileBinaryFactory, MediaMetaDataMap, MediaParamsFactory, MediaVaultParamsMap, MediaVaultType, MediaVaultTypeMap, MetaDataFactory } from "../models/mediaModelFactory.js";


export abstract class MediaVault extends VaultIndexDirectory {

    protected constructor(rootPath : string, index : VaultIndex) {
        super(rootPath, IndexType.Vault, index);
    }
    
    protected getMediaKey(entryKey : string, extension : string) : string {
        return `${entryKey.replace(/[^a-zA-Z0-9]/g, '-')}${extension}`;
    }

    protected getMediaPathFromEntryKey(entryKey : string, extension : string) : string {
        return `${this.rootPath}/${this.getMediaKey(entryKey, extension)}`;
    }
    
    protected getMediaPathFromMediaKey(mediaKey : string) : string {
        return `${this.rootPath}/${mediaKey}`;
    }

    async addEntry<T extends MediaVaultType>(vaultType: T, entryKey: EntryKey, media: MediaVaultTypeMap[T]): Promise<void> {
        const mediaPath = this.getMediaPathFromEntryKey(entryKey.key, media.extension);
        const metaData = MetaDataFactory.create(vaultType, entryKey.key, media.extension);
        await this.addToIndex(entryKey, metaData);
        await putFile(mediaPath, media.buffer);
    }

    async getEntry<T extends MediaVaultType>(vk : T, entryKey : EntryKey) : Promise<MediaVaultTypeMap[T] | undefined> {
        if (this.hasIndexEntry(entryKey)) {
            const metaData = this.index.getEntry(entryKey) as MediaMetaDataMap[T];
            if (metaData !== undefined) {
                const mediaPath = this.getMediaPathFromEntryKey(metaData.mediaKey, metaData.extension);
                const fileBinary = await fetchFile(mediaPath);
                const params = MediaParamsFactory.create<T>(vk, fileBinary, metaData);
                
                return FileBinaryFactory.create<T>(vk, params);
            }
        }
        return undefined;
    }
}

export class ImageDirectoryVault extends MediaVault {
    static async from(rootPath : string) : Promise<ImageDirectoryVault | undefined> {
        const factory = new IndexFactory(rootPath, IndexType.Vault);
        let index = await factory.buildIndex();

        if (index !== undefined) {
            return new ImageDirectoryVault(rootPath, index);
        }
         
        return undefined;
    }

    private constructor(rootPath : string, index : VaultIndex) {
        super(rootPath, index);
    }
    
    protected override async addToIndex(entryKey: EntryKey, metaData : ImageMetaData): Promise<void> {
        super.addToIndex(entryKey, metaData);
    }

    // protected override async getMediaParams<T extends MediaVaultType>(
    //     fileBinary: FileBinary,
    //     extension: string
    // ): Promise<MediaVaultParamsMap[T]> {
    //     // For images, we need to calculate the aspect ratio
    //     // This is a placeholder - you'll need to implement actual aspect ratio calculation
    //     const aspectRatio = 1.0; // Calculate this from the image

    //     const params: ImageBinaryParams = {
    //         buffer: fileBinary.buffer,
    //         size: fileBinary.size,
    //         extension: extension,
    //         aspectRatio: aspectRatio
    //     };

    //     return params as MediaVaultParamsMap[T];
    // }

    // override async getEntry(entryKey: string): Promise<ImageBinary | undefined> {
    //     if (this.hasIndexEntry(entryKey)) {
    //         const metaData = this.index.getEntry(entryKey) as ImageMetaData;
    //         if (metaData !== undefined) {
    //             const media = await this.getMediaParams(metaData);
    //             if (media !== undefined) {
    //                 return FileBinaryFactory.create<ImageBinary>(MediaVaultType.Image, media);
    //             }
    //         }
    //     }
    //     return undefined;
    // }

    // protected override createMetaData<T extends MediaVaultType>(entryKey: string): Promise<MetaData> {
    //     return {
    //         mediaKey: this.getMediaKey(entryKey, media.extension),
    //         extension: media.extension,
    //         aspectRatio: 1.0  // Calculate actual aspect ratio here
    //     };
    // }
}