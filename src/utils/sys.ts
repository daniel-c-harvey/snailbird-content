import {ExecException, exec as sysExec} from 'child_process';

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