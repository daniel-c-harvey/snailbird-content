import http from 'http';
import url from 'url';
import { MediaBinary } from '../models/mediaModel.js'
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

        // this.server.get('/img', (_, res) => {
        //     this.sendImg(res);
        // })

        this.server.listen(3030);
    }

    async sendImg(res: Express.Response) {
        let image: MediaBinary | undefined = await this.fdb.loadResource("img", "muskX.png");
        // let image: ImageBinary = await this.fdb.getImageAsync("./media/test.png");
        if (image != undefined && Buffer.isBuffer(image.buffer)) 
        {
            res.type('png');
            res.send(image.buffer);
            res.end(null, 'binary');
        }
    }
}