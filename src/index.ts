// import { ImageBinary } from './models/imageModel.js';
import { ImageBinary } from './models/imageModel.js';
import * as X from './services/fileDatabase.js'
import { server } from './services/server.js';
// import * as Sys from './utils/sys'
// import { LinkedList } from './utils/adt.js'

// let image : ImageBinary = await loadImageAsync("../muskX.png");

// console.log(image.buffer);

// let y : ImageBinary = await X.streamImageAsync("../muskX.png");

// console.log(y);

server.listen(3000);