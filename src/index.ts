import { Server } from './services/server.js';

try {
    await Server.build();
} catch (error) {
    console.log(error)
}