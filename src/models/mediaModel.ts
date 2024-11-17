// export interface Image {
//     imageBase64 : string
// }

export class MediaBinary {
    buffer: Buffer;
    size: number;

    constructor(buffer : Buffer, size : number) {
        this.buffer = buffer;
        this.size = size;
    }
}

export class ImageBinary extends MediaBinary {
    extension: string;

    constructor(buffer : Buffer, size : number, extension : string) { 
        super(buffer, size);
        this.extension = extension;
    }
}

export interface ImageBase64 {
    imageCode : string;
    size: number;
    extension: string;
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