import {ExecException, exec as sysExec} from 'child_process';
import { BinaryLike, createHash } from 'crypto';

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

// export function JSONSerialize(obj : any) {
//     return JSON.stringify(obj, (_, value) => {
//         if (value instanceof Set) {
//             return Array.from(value);
//         }
//         return value;
//     })
// }

// export function JSONDeserialize(json : string) : any {
//     return JSON.parse(json, (key, value) => {
//         if (key === '') {
//             return value;
//         }
//     })
// }

export function hash(toHash: BinaryLike) : string {
    const hasher = createHash('sha256');
    hasher.update(toHash);
    let hash = hasher.digest('base64');
    return hash;
}