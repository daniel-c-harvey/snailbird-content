import { reverse } from "../utils/reverse.js";

export class FileBinaryDto {
    base64 : string;
    size : number;

    constructor(other : FileBinary) {
        this.base64 = other.buffer.toString('base64');
        this.size = other.size;
    }
}

export interface FileBinaryParams {
    buffer : Buffer;
    size : number;
}

export class FileBinary {
    buffer: Buffer;
    size: number;

    constructor(params : FileBinaryParams) {
        this.buffer = params.buffer;
        this.size = params.size;
    }

    static from(other : FileBinaryDto) : FileBinary {
        return {
            buffer : Buffer.from(other.base64, 'base64'),
            size : other.size
        }
    }
}

export class MediaBinaryDto extends FileBinaryDto {
    mime: string;

    constructor(other : MediaBinary) {
        super(other);
        this.mime = getMimeType(other.extension)
    }
}

export interface MediaBinaryParams extends FileBinaryParams {
    extension : string;
}

export class MediaBinary extends FileBinary {
    extension: string;

    constructor(params : MediaBinaryParams) {
        super(params);
        this.extension = params.extension;
    }

    static override from(other : MediaBinaryDto) : MediaBinary {
        return {
            ...super.from(other),
            extension : getExtensionType(other.mime)
        }
    }
}

export class ImageBinaryDto extends MediaBinaryDto {
    aspectRatio : number;

    constructor(other : ImageBinary) {
        super(other);
        this.aspectRatio = other.aspectRatio;
    }
}

export interface ImageBinaryParams extends MediaBinaryParams {
    aspectRatio : number;
}

export class ImageBinary extends MediaBinary {
    aspectRatio : number;

    constructor(params : ImageBinaryParams) { 
        super(params);
        this.aspectRatio = params.aspectRatio;
    }

    static override from(other : ImageBinaryDto) : ImageBinary {
        return {
            ...super.from(other),
            aspectRatio : other.aspectRatio
        }
    }
}

// Map of common image extensions to MIME types
const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp'
};

const EXTENSIONS = reverse(MIME_TYPES);

function getMimeType(extension: string): string {
    return MIME_TYPES[extension.toLowerCase()];
}

function getExtensionType(mime : string) : string {
    return EXTENSIONS[mime.toLowerCase()];
}

