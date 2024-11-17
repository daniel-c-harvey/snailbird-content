import { Server } from './services/server.js';
import { passSecret } from './utils/secrets.js';

// try {
//     await Server.build();
// } catch (error) {
//     console.log(error)
// }

console.log(await passSecret('manager', ''));