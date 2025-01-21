
export class MediaBinaryDto {
    bytes : number[];
    size : number;
    mime: string;

    constructor(other : MediaBinary) {
        this.bytes = Array.from(other.buffer);
        this.size = other.size;
        this.mime = getMimeType(other.extension)
    }
}

export class MediaBinary {
    buffer: Buffer;
    size: number;
    extension: string;

    constructor(bytes : number[], size : number, extension : string) {
        this.buffer = Buffer.from(bytes);
        this.size = size;
        this.extension = extension;
    }
}

export class ImageBinary extends MediaBinary {
    constructor(bytes : number[], size : number, extension : string) { 
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

function getMimeType(extension: string): string {
    return MIME_TYPES[extension.toLowerCase()];
}