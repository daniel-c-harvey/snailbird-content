import http from 'http';
import url from 'url';
import { ImageBase64, ImageBinary } from '../models/imageModel.js'
import { FileDatabase } from './fileDatabase.js';
import express from 'express';
import * as Express from 'express';
import { Buffer } from 'buffer';

export class Server {
    server : Express.Application;
    fdb : FileDatabase;

    constructor() {
        this.server = express();

        this.fdb = new FileDatabase('./media');

        this.server.get('/img', (_, res) => {
            this.sendImg(res);
        })

        this.server.listen(3000);
    }
    
    async routeRequest(req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) {
        let uri : string = '';
        if (typeof req.url != 'undefined') { uri = req.url; }
        const parsedUrl = url.parse(uri, true)
        res.setHeader('Content-Type', 'application/json');
        
        // available routes
        if (parsedUrl.pathname === '/img' && req.method === 'GET') 
        {
            await this.getImg(res);
        } 
        // default, 404 route
        else 
        {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Route not found' }));
        }
    }

    async getImg(res: http.ServerResponse<http.IncomingMessage>) {
        let image: ImageBinary = await this.fdb.getImageAsync("../muskX.png");
        let decoder = new TextDecoder();
        
        let imagePackage: ImageBase64 = {
            imageCode: image.buffer.toString('base64'),
            extension: image.extension,
            size: image.size
        };
        
        res.write(JSON.stringify(imagePackage));
        res.end();
    }

    async sendImg(res: Express.Response) {
        let image: ImageBinary = await this.fdb.getImageAsync("./media/muskX.png");
        // let image: ImageBinary = await this.fdb.getImageAsync("./media/test.png");
        if (Buffer.isBuffer(image.buffer)) 
        {
            res.type('png');
            res.send(image.buffer);
            res.end(null, 'binary');
        }
    }
}