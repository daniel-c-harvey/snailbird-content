import { promises as fs } from 'fs';
import { FileHandle } from 'fs/promises';
import { extname } from 'path';
import { ImageBinary } from '../models/imageModel';
import { LinkedList } from '../utils/adt.js';

// export class FileDatabase 
// {
//     rootPath : string;
    
//     constructor(rootPath : string)
//     {
//         this.rootPath = rootPath;
//     }
// }

export async function streamImageAsync(imagePath: string): Promise<ImageBinary> {
    try {        
        const fileHandle : FileHandle = await fs.open(imagePath, 'r');
        const fr = fileHandle.createReadStream();

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
                chunks.apply( (data : Buffer) => size += data.length );
                
                // allocate and copy the chunk buffers
                const bytes = Buffer.alloc(size);
                let offset = 0;
                chunks.apply((data) => {
                    let index;
                    for (index = 0; index < data.length; index++)
                    {
                        bytes.writeUInt8(data.readUInt8(index), index + offset);
                    }
                    offset += index;
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