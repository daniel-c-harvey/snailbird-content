import http from 'http';
import url from 'url';
import { ImageBase64, ImageBinary } from '../models/imageModel.js'
import { streamImageAsync } from './fileDatabase.js';

export const server = http.createServer((req : http.IncomingMessage, res : http.ServerResponse) => {
  routeRequest(req, res);
});

async function routeRequest(req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) {
    let uri : string = '';
    if (typeof req.url != 'undefined') { uri = req.url; }
    const parsedUrl = url.parse(uri, true)
    res.setHeader('Content-Type', 'application/json');

    // available routes
    if (parsedUrl.pathname === '/img' && req.method === 'GET') 
    {
        let image : ImageBinary = await streamImageAsync("../muskX.png")
        let decoder = new TextDecoder();
        
        let imagePackage : ImageBase64 = {
            // imageCode : decoder.decode(image.buffer),
            imageCode : image.buffer.toString('base64'),
            extension: image.extension,
            size: image.size
        };

        res.write(JSON.stringify(imagePackage));
        res.end();
    } 
    // default, 404 route
    else 
    {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
}