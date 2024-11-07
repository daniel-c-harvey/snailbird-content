import { promises as fs } from 'fs';
import * as Path  from 'path';

export default class FileDatabase 
{
    rootPath : string;

    constructor(rootPath : string)
    {
        this.rootPath = rootPath;
    }
}

export async function loadImageAsync(imagePath: string): Promise<ImageData> {
    try {
        const imageBuffer = await fs.readFile(imagePath);
        const extension = Path.extname(imagePath);
        return {
            buffer: imageBuffer,
            size: imageBuffer.length,
            extension
        };
    } catch (error) {
        throw new Error(`Failed to load image: ${(error as Error).message}`);
    }
}