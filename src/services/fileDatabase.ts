import { promises as fs, ReadStream } from 'fs';
import { FileHandle } from 'fs/promises';
import { extname } from 'path';
import { ImageBinary } from '../models/imageModel.js';
import { LinkedList } from '../utils/adt.js';
import { Buffer } from 'buffer';

export class FileDatabase 
{
    rootPath : string;
    
    constructor(rootPath : string)
    {
        this.rootPath = rootPath;
    }

    async getImageAsync(imagePath: string): Promise<ImageBinary> {
        try {        
            const fileHandle : FileHandle = await fs.open(imagePath, 'r');
            const fr : ReadStream = fileHandle.createReadStream();
    
            return new Promise<ImageBinary>((resolve) =>
            {
                let size = 0;
                const extension = extname(imagePath);
                const chunks = new LinkedList<Buffer>();
    
                fr.on('data', (chunk : Buffer) => {
                    chunks.add(chunk);
                });
    
                fr.on('end', () => {
                    // close the stream;
                    fr.close();
    
                    // calculate the total size in bytes of all chunks
                    chunks.apply( (data : Buffer) => size += data.byteLength );
                    
                    // allocate and copy the chunk buffers
                    let offset = 0;
                    let bytes = Buffer.alloc(size);
                    chunks.apply((data : Buffer) => {
                        var index;
                        for (index = 0; index < data.byteLength; index++) {
                            bytes[offset + index] = data[index];
                        }
                        offset += data.byteLength;
                    });

                    resolve({
                        buffer: bytes,
                        size: bytes.length,
                        extension
                    });
                });
            });
        } catch (error) {
            throw new Error(`Failed to load image: ${(error as Error).message}`);
        }
    }

    async streamMediaAsync(filePath : string) : Promise<ReadStream> {
        let fd : FileHandle = await fs.open(filePath);
        return new Promise<ReadStream>((resolve) => resolve(fd.createReadStream()));
    }
}