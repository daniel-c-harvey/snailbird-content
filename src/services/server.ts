
import express, * as Express from 'express';
import { Buffer } from 'buffer';
import { MediaBinary } from '../models/mediaModel.js'
import { FileDatabase } from './fileDatabase.js';
import { MediaVault } from './vault.js';

export class Server {
    expressServer : Express.Application;
    fileDB : FileDatabase;

    static async build() : Promise<Server | undefined> {
        let fdb = await FileDatabase.from('./media');

        if (fdb !== undefined) {
            return new Server(fdb);            
        }
        return undefined;
    }
    
    private constructor(fdb : FileDatabase) {
        this.fileDB = fdb;
        this.expressServer = express();

        this.expressServer.use(Express.json({strict : true}));

        // Register METHOD Handlers
        this.registerVaultMethods('img');
        
        this.expressServer.listen(36969);
    }

    private registerVaultMethods(vaultKey : string) {
        if (!this.fileDB.hasVault(vaultKey)) {
            this.fileDB.createVault(vaultKey, new MediaVault());
        }

        this.expressServer.get(`/${vaultKey}/:entryKey`, async (req, res) => {
            let key = req.params['entryKey'];
            if (key !== undefined && key !== '' && key.length > 0) {
                await this.respondGetImg(key, res);
            }
        });

        this.expressServer.post(`/${vaultKey}/:entryKey`, async (req, res) => {
            let key = req.params['entryKey'];
            let obj = req.body;

            if (key !== undefined && key !== '' && 
                key.length > 0 && obj instanceof MediaBinary &&
                obj.size > 0 && obj.buffer !== undefined
            ) {
                await this.respondPutImg(key, obj, res);
            } else {
                this.FourOhFour(res);
            }
        });
    }

    async respondGetImg(imgKey : string, res: Express.Response) {
        if (this.fileDB !== undefined) {
            let image = await this.fileDB.loadResource("img", imgKey);
            
            if (image !== undefined && Buffer.isBuffer(image.buffer)) 
            {
                res.type('png');
                res.send(image.buffer);
                res.end(null, 'binary');
            } else {
                this.FourOhFour(res);
            }
        }
    }

    async respondPutImg(imgKey : string, media : MediaBinary, res: Express.Response) {
        if (await this.fileDB.registerResource('img', imgKey, media)) {
            res.type('application/json');
            res.statusCode = 200;
        } else {
            res.statusCode = 403;
        }
        res.end(null, 'utf-8');
    }

    FourOhFour(res : Express.Response) {
        res.type('application/json');
        res.statusCode = 404;
        res.end(null, 'utf-8');
    }
}