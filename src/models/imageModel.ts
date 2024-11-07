export interface Image {
    imageBase64 : string
}

// Map of common image extensions to MIME types
// const MIME_TYPES: Record<string, string> = {
//     '.jpg': 'image/jpeg',
//     '.jpeg': 'image/jpeg',
//     '.png': 'image/png',
//     '.gif': 'image/gif',
//     '.webp': 'image/webp',
//     '.svg': 'image/svg+xml',
//     '.bmp': 'image/bmp'
// };

// function getMimeType(extension: string): string {
//     return MIME_TYPES[extension.toLowerCase()];
// }