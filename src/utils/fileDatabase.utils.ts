import { Buffer } from 'buffer';
import { promises as fs, ReadStream, StatsFs, WriteStream } from 'fs';
import { FileHandle } from 'fs/promises';
import { BinaryLike, createHash, Hash } from 'crypto';
import { MediaBinary } from '../models/mediaModel.js';
import { LinkedList } from './adt.js';
import { serialize, deserialize } from 'v8';

export async function fetchFile(mediaPath : string) : Promise<MediaBinary> {
    try {        
        const fileHandle : FileHandle = await fs.open(mediaPath, 'r');
        const fileReader : ReadStream = fileHandle.createReadStream();

        return new Promise<MediaBinary>((resolve) =>
        {
            let size = 0;
            const chunks = new LinkedList<Buffer>();

            fileReader.on('data', (chunk : Buffer) => {
                chunks.add(chunk);
            });

            fileReader.on('end', () => {
                // close the stream;
                fileReader.close();
                fileHandle.close();

                // calculate the total size in bytes of all chunks
                chunks.apply( (data : Buffer) => size += data.byteLength );
                
                // allocate and copy the chunk buffers
                let offset = 0;
                const bytes = Buffer.alloc(size);
                chunks.apply((data : Buffer) => {
                    var index;
                    for (index = 0; index < data.byteLength; index++) {
                        bytes[offset + index] = data[index];
                    }
                    offset += data.byteLength;
                });

                resolve({
                    buffer: bytes,
                    size: bytes.length
                });
            });
        });
    } catch (error) {
        throw new Error(`Failed to load media: ${(error as Error).message}`);
    }
}

export async function putFile(mediaPath : string, buffer : Buffer) {
    try {        
        const fileHandle : FileHandle = await fs.open(mediaPath, 'w', );
        const fileWriter : WriteStream = fileHandle.createWriteStream();
        const chunkSize = 64 * 1024;
        
        let index = 0;
        let write = async function () { 
            while (fileWriter.writable) {
                if (index < buffer.length) {
                    fileWriter.write(buffer.subarray(index, Math.min(index + chunkSize,buffer.length)));
                    index += chunkSize;
                } else {
                    fileWriter.close();
                    fileHandle.close();
                }
            }
         }

         fileWriter.on('drain', () => {
            write();
         });

         write();

    } catch (error) {
        throw new Error(`Failed to write media: ${(error as Error).message}`);
    }
}

export async function fetchObject(path : string) : Promise<any> {
    let bytes = await fetchFile(path);
    if (bytes.size > 0) {
        return deserialize(bytes.buffer);
    }
}

export async function putObject(path : string, obj : any) {
    await putFile(path, Buffer.from(serialize(obj)));
}

export async function vaultExists(path : string) : Promise<boolean> {
    let x;

    try {
        x = await fetchObject(path + '/index');
    }
    catch (e) {
        return false;
    }

    return (x !== undefined);
}

export async function makeVaultDirectory(path : string) {
    await fs.mkdir(path);
}
