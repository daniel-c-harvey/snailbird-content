import { Buffer } from 'buffer';
import { promises as fs, ReadStream, WriteStream } from 'fs';
import { FileHandle } from 'fs/promises';
import { MediaBinary } from '../models/mediaModel.js';
import { LinkedList } from './adt.js';
import { serialize, deserialize } from 'v8';

export async function fetchFile(mediaPath : string) : Promise<MediaBinary> {
    return new Promise<MediaBinary>((resolve, reject) => {
        let fileReader : ReadStream;
        
        try {
            fs.open(mediaPath, 'r')
                .then((handle) => {
                    fileReader = handle.createReadStream();
                    
                    let size = 0;
                    const chunks = new LinkedList<Buffer>();

                    fileReader.on('error', (error) => {
                        handle.close();
                        fileReader.close();
                        reject(error);
                    });

                    fileReader.on('data', (chunk : Buffer) => {
                        chunks.add(chunk);
                    });

                    fileReader.on('end', () => {
                        try {    
                            // close the stream;
                            fileReader.close();
                            handle.close();
                            
                            // calculate the total size in bytes of all chunks
                            chunks.apply( (data : Buffer) => size += data.byteLength );
                            
                            // allocate and copy the chunk buffers
                            let offset = 0;
                            const bytes = Buffer.alloc(size);
                            chunks.apply((data : Buffer) => {
                                data.copy(bytes, offset);
                                offset += data.byteLength;
                            });
                            
                            resolve({
                                buffer: bytes,
                                size: bytes.length
                            });
                        } catch (error) {
                            reject(error);
                        }
                    });    
                })
                .catch((error) => {
                    console.error(`Failed to load media: ${(error as Error).message}`);
                    reject(error);
                });
        } catch (error) {
            console.error(`Failed to load media: ${(error as Error).message}`);
            reject(error);
        }      
    });
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
        console.error(`Failed to write media: ${(error as Error).message}`);
    }
}

export async function fetchObject(path : string) : Promise<any> {
    return new Promise<any>((resolve, reject) => {
        try {
            fetchFile(path)
            .then(
                bytes => resolve(deserialize(bytes.buffer)),
                error => reject(error)
            );
        } catch (error) { 
            reject(error);
        }
    });
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
