import { ImageMetaData, MetaData } from "./fileDatabase.models.js"
import { FileBinary, ImageBinary, ImageBinaryParams, MediaBinary, MediaBinaryParams } from "./mediaModel.js"

// Common Types

export enum MediaVaultType {
    Media,
    Image
}

export type MediaVaultTypeMap = {
    [MediaVaultType.Media]: MediaBinary,
    [MediaVaultType.Image]: ImageBinary
}

export type MediaVaultParamsMap = {
    [MediaVaultType.Media]: MediaBinaryParams,
    [MediaVaultType.Image]: ImageBinaryParams
}

export type MediaMetaDataMap = {
    [MediaVaultType.Media]: MetaData,
    [MediaVaultType.Image]: ImageMetaData
}

// MetaData Factory

type MetaDataBuilder<T extends MediaVaultType> =
    (entryKey: string, extension: string, aspectRatio?: number) => MediaMetaDataMap[T];

const metaDataBuilder: { [T in MediaVaultType]: MetaDataBuilder<T> } = {
    [MediaVaultType.Media]: (entryKey: string, extension: string): MetaData => {
        return {
            mediaKey: entryKey,
            extension: extension
        };
    },
    [MediaVaultType.Image]: (entryKey: string, extension: string, aspectRatio: number = 1.0): ImageMetaData => {
        return {
            mediaKey: entryKey,
            extension: extension,
            aspectRatio: aspectRatio
        };
    }
};

export class MetaDataFactory {
    static create<T extends MediaVaultType>(type: T,entryKey: string, extension: string, aspectRatio?: number): MediaMetaDataMap[T] {
        return metaDataBuilder[type](entryKey, extension, aspectRatio);
    }
}

// MediaParams Factory

type MediaParamsBuilder<T extends MediaVaultType> = 
    (fileBinary: FileBinary, metaData: MediaMetaDataMap[T]) => MediaVaultParamsMap[T];

const mediaParamsBuilder: { [T in MediaVaultType]: MediaParamsBuilder<T> } = {
    [MediaVaultType.Media]: (fileBinary: FileBinary, metaData: MetaData): MediaBinaryParams => ({
        buffer: fileBinary.buffer,
        size: fileBinary.size,
        extension: metaData.extension
    }),
    [MediaVaultType.Image]: (fileBinary: FileBinary, metaData: ImageMetaData): ImageBinaryParams => ({
        buffer: fileBinary.buffer,
        size: fileBinary.size,
        extension: metaData.extension,
        aspectRatio: metaData.aspectRatio
    })
};

export class MediaParamsFactory {
    static create<T extends MediaVaultType>(
        type: T, 
        fileBinary: FileBinary,
        metaData: MediaMetaDataMap[T]
    ): MediaVaultParamsMap[T] {
        return mediaParamsBuilder[type](fileBinary, metaData);
    }
}

// Media Binary Factory

type MediaBinaryBuilder<T extends MediaVaultType> = 
    (params: MediaVaultParamsMap[T]) => MediaVaultTypeMap[T];

const mediaBuilder: { [T in MediaVaultType]: MediaBinaryBuilder<T> } = {
    [MediaVaultType.Media]: (params: MediaBinaryParams) => new MediaBinary(params),
    [MediaVaultType.Image]: (params: ImageBinaryParams) => new ImageBinary(params)
};

export class FileBinaryFactory {
    static create<TBinary extends MediaVaultType>(vaultType : TBinary, params : MediaVaultParamsMap[TBinary]) : MediaVaultTypeMap[TBinary] {
        return mediaBuilder[vaultType](params);
    }
}