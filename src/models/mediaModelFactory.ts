import { ImageMetaData, MetaData } from "./fileDatabase.models.js"
import { FileBinary, ImageBinary, ImageBinaryDto, ImageBinaryParams, MediaBinary, MediaBinaryDto, MediaBinaryParams } from "./mediaModel.js"

// Common Types

export enum MediaVaultType {
    Media,
    Image
}

export type MediaVaultTypeMap = {
    [MediaVaultType.Media]: MediaBinary,
    [MediaVaultType.Image]: ImageBinary
}

export type MediaVaultDtoTypeMap = {
    [MediaVaultType.Media]: MediaBinaryDto,
    [MediaVaultType.Image]: ImageBinaryDto
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

type MediaBinaryConvertor<T extends MediaVaultType> = 
    (mediaBinary: MediaVaultDtoTypeMap[T]) => MediaVaultTypeMap[T];

const mediaConvertor: { [T in MediaVaultType]: MediaBinaryConvertor<T> } = {
    [MediaVaultType.Media]: (mediaBinary: MediaBinaryDto) => MediaBinary.from(mediaBinary),
    [MediaVaultType.Image]: (mediaBinary: ImageBinaryDto) => ImageBinary.from(mediaBinary)
};

type MediaBinaryDtoConvertor<T extends MediaVaultType> = 
    (mediaBinary: MediaVaultTypeMap[T]) => MediaVaultDtoTypeMap[T];

const mediaDtoConvertor: { [T in MediaVaultType]: MediaBinaryDtoConvertor<T> } = {
    [MediaVaultType.Media]: (mediaBinary: MediaBinary) => new MediaBinaryDto(mediaBinary),
    [MediaVaultType.Image]: (mediaBinary: ImageBinary) => new ImageBinaryDto(mediaBinary)
};

export class FileBinaryFactory {
    static create<TBinary extends MediaVaultType>(vaultType : TBinary, params : MediaVaultParamsMap[TBinary]) : MediaVaultTypeMap[TBinary] {
        return mediaBuilder[vaultType](params);
    }

    static from<TBinary extends MediaVaultType>(type : TBinary, mediaBinaryDto: MediaVaultDtoTypeMap[TBinary]) : MediaVaultTypeMap[TBinary] {
        return mediaConvertor[type](mediaBinaryDto);
    }    
}

export class FileBinaryDtoFactory {
    static from<TBinary extends MediaVaultType>(type : TBinary, mediaBinary: MediaVaultTypeMap[TBinary]) : MediaVaultDtoTypeMap[TBinary] {
        return mediaDtoConvertor[type](mediaBinary);
    }
}
