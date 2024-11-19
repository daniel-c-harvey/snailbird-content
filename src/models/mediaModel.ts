
export interface MediaBinaryDto {
    bytes : number[];
    size : number;
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
    extension: string;

    constructor(bytes : number[], size : number, extension : string) { 
        super(bytes, size);
        this.extension = extension;
    }
}

// export interface ImageBase64 {
//     imageCode : string;
//     size: number;
//     extension: string;
// }

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