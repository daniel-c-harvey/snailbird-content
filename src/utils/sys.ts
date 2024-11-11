import {ExecException, exec as sysExec} from 'child_process';
import { promises as fs, ReadStream } from 'fs';
import { FileHandle } from 'fs/promises';
import { Buffer } from 'buffer';
import { LinkedList } from '../utils/adt.js';
import { MediaBinary } from '../models/mediaModel.js';

export function exec(command : string)
{
    sysExec(command, (error : ExecException | null, stdout : string, stderr : string) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

export async function streamFile(mediaPath : string) : Promise<MediaBinary> {
    try {        
        const fileHandle : FileHandle = await fs.open(mediaPath, 'r+');
        const fr : ReadStream = fileHandle.createReadStream();

        return new Promise<MediaBinary>((resolve) =>
        {
            let size = 0;
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
        throw new Error(`Failed to load image: ${(error as Error).message}`);
    }
}