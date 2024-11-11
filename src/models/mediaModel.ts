// export interface Image {
//     imageBase64 : string
// }

export interface MediaBinary {
    buffer: Buffer;
    size: number;
}

export interface ImageBinary extends MediaBinary {
    extension: string;
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