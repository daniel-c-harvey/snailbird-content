import { reverse } from "../utils/reverse.js";

export class FileBinaryDto {
    bytes : number[];
    size : number;

    constructor(other : FileBinary) {
        this.bytes = Array.from(other.buffer);
        this.size = other.size;
    }
}

export class MediaBinaryDto extends FileBinaryDto {
    mime: string;

    constructor(other : MediaBinary) {
        super(other);
        this.mime = getMimeType(other.extension)
    }
}

export class FileBinary {
    buffer: Buffer;
    size: number;

    constructor(bytes : Buffer, size : number) {
        this.buffer = bytes;
        this.size = size;
    }
}

export class MediaBinary extends FileBinary {
    extension: string;

    constructor(bytes : Buffer, size : number, extension : string) {
        super(bytes, size);
        this.extension = extension;
    }

    static from(other : MediaBinaryDto) {
        return {
            buffer : Buffer.from(other.bytes),
            size : other.size,
            extension : getExtensionType(other.mime)
        }
    }
}

export class ImageBinary extends MediaBinary {
    constructor(bytes : Buffer, size : number, extension : string) { 
        super(bytes, size, extension);
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