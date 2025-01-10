export interface CommandOptions {
    databaseRootPath : string;
    port : number;

}

export function parseCommands() : CommandOptions {
    const options = { port : 36969, databaseRootPath : './media'};

    for (let i = 2; i < process.argv.length - 1; i++) {
        let arg = process.argv[i];
        switch (arg) {
            case '-p':
                options.port = Number.parseInt(process.argv[++i]);
                break;
            case '-f':
                options.databaseRootPath = process.argv[++i];
                break;
        }
    }
    return options;
}