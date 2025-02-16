import { Buffer } from 'buffer';
import { promises as fs, ReadStream, WriteStream } from 'fs';
import { FileHandle } from 'fs/promises';
import { FileBinary } from '../models/mediaModel.js';
import { LinkedList } from './adt.js';
import { serialize, deserialize } from 'v8';
import { finished } from 'stream/promises';
import { StringDecoder } from 'string_decoder';

export async function fetchFile(mediaPath : string) : Promise<FileBinary> {
    let fileHandle : FileHandle;
    let fileReader : ReadStream;

    fileHandle = await fs.open(mediaPath, 'r')
    fileReader = fileHandle.createReadStream({highWaterMark : 64 * 1024});
    
    let size = 0;
    const chunks = new LinkedList<Buffer>();
    
    fileReader.on('data', (chunk : Buffer) => {
        chunks.add(chunk);
        size += chunk.byteLength;
    });

    await finished(fileReader);

    // Close the stream & Handle
    fileReader.close(); 
    await fileHandle.close();

    // allocate and copy the chunk buffers
    let offset = 0;
    const bytes = Buffer.alloc(size);
    chunks.apply((data: Buffer) => {
        data.copy(bytes, offset);
        offset += data.byteLength;
    });

    return new FileBinary({buffer: bytes, size: bytes.length});
}

export async function putFile(mediaPath : string, buffer : Buffer) {
    try {        
        const fileHandle : FileHandle = await fs.open(mediaPath, 'w', );
        const fileWriter : WriteStream = fileHandle.createWriteStream();
        const chunkSize = 64 * 1024;
        
        let index = 0;
        
        let write = async function (buffer : Buffer) { 
            while (fileWriter.writable) {
                if (index < buffer.length) {
                    fileWriter.write(buffer.subarray(index, Math.min(index + chunkSize, buffer.length)));                    
                    index += chunkSize;
                } else {
                    fileWriter.close();
                    await fileHandle.close();
                }
            }
        }
        
        fileWriter.on('drain', async () => await write(buffer));
        
        await write(buffer);
        
    } catch (error) {
        console.error(`Failed to write media: ${(error as Error).message}`);
    }
}

export async function fetchObject(path : string) : Promise<any> {
    const bytes = await fetchFile(path);
    return deserialize(bytes.buffer);
}

export async function fetchJSON(path : string) : Promise<string> {
    const UTF8Decoder = new StringDecoder('utf-8');
    const bytes = await fetchFile(path);
    const x = UTF8Decoder.end(bytes.buffer);
    return x;
}
    
export async function putObject(path : string, obj : any) {
    await putFile(path, Buffer.from(serialize(obj)));
}

export async function vaultExists(path : string) : Promise<boolean> {
    let index = await fetchObject(path + '/index');
    return index !== undefined;
}

export async function makeVaultDirectory(path : string) {
    await fs.mkdir(path);
}
