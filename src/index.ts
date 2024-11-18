import { Server } from './services/server.js';
import { parseCommands } from './utils/params.js';

//* Command Parsing */
const options = parseCommands();

try {
    await Server.build(options.port);
} catch (error) {
    console.log(error)
}