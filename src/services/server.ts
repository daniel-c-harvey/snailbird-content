import http from 'http';
import url from 'url';
import { MediaBinary } from '../models/mediaModel.js'
import { FileDatabase } from './fileDatabase.js';
import express from 'express';
import * as Express from 'express';
import { Buffer } from 'buffer';

export class Server {
    expressServer : Express.Application;
    fileDB : FileDatabase | undefined;

    static async build() : Promise<Server> {
        let server = new Server();
        server.fileDB = await FileDatabase.from('./media');

        // Register METHOD Handlers
        server.expressServer.get('/img', (_, res) => {
            server.sendImg(res);
        });

        server.expressServer.listen(3030);
        return server;
    }
    
    private constructor() {
        this.expressServer = express();
    }

    async sendImg(res: Express.Response) {
        if (this.fileDB !== undefined) {
            let image = await this.fileDB.loadResource("img", "muskX.png");
            // let image: ImageBinary = await this.fdb.getImageAsync("./media/test.png");
            if (image !== undefined && Buffer.isBuffer(image.buffer)) 
            {
                res.type('png');
                res.send(image.buffer);
                res.end(null, 'binary');
            }
        }
    }
}