export interface CommandOptions {
    port : number;
}

export function parseCommands() : CommandOptions {
    const options = { port : 36969 };
    for (let i = 2; i < process.argv.length - 1; i++) {
        let arg = process.argv[i];
        switch (arg) {
            case '-p':
                options.port = Number.parseInt(process.argv[++i]);
        }
    }
    return options;
}