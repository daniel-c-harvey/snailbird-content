
export class MediaBinaryDto {
    bytes : number[];
    size : number;

    constructor(other : MediaBinary) {
        this.bytes = Array.from(other.buffer);
        this.size = other.size;
    }
}

export class MediaBinary {
    buffer: Buffer;
    size: number;

    constructor(bytes : number[], size : number) {
        this.buffer = Buffer.from(bytes);
        this.size = size;
    }
}

export class ImageBinary extends MediaBinary {
    extension: string; // todo migrate this up to MediaBinary or find a way to choose the correct MediaVault and MediaBinary sub-types;  aggregate types for which vault and binary types are associated with a particular type of media, and key that when constructing vaults.

    constructor(bytes : number[], size : number, extension : string) { 
        super(bytes, size);
        this.extension = extension;
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