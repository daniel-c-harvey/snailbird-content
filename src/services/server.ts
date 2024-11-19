
import express, * as Express from 'express';
import { Buffer } from 'buffer';
import { MediaBinary, MediaBinaryDto } from '../models/mediaModel.js'
import { FileDatabase } from './fileDatabase.js';
import { MediaVault } from './vault.js';
import { passSecret } from '../utils/secrets.js';
import { Server as HttpServer } from 'http';


export class Server {
    express : Express.Application;
    server : HttpServer;
    fileDB : FileDatabase;

    static async build(fdbRootPath : string, port : number) : Promise<Server | undefined> {
        let fdb = await FileDatabase.from(fdbRootPath);

        if (fdb !== undefined) {
            return new Server(fdb, port);            
        }
        return undefined;
    }
    
    private constructor(fdb : FileDatabase, port : number) {
        this.fileDB = fdb;
        this.express = express();

        this.express.use(Express.json({strict : true}));  // idk what the consequences of this are

        // Register METHOD Handlers for each vault
        this.registerVaultMethods('img');

        // Register Catch-all route handler
        this.express.use((_1, res, _2) => {
            // If we reach this point unhandled, terminate with a 404
            if (!res.closed) {
                FourOhFour(res);
            }
        })
        
        this.server = this.express.listen(port);
    }

    private registerVaultMethods(vaultKey : string) {
        if (!this.fileDB.hasVault(vaultKey)) {
            this.fileDB.createVault(vaultKey, new MediaVault());
        }

        // the endpoint for VIEWING the vault media
        this.express.get(`/${vaultKey}/:entryKey`, async (req, res) => {
            let key = req.params['entryKey'];
            if (key !== undefined && key !== '' && key.length > 0) {
                await this.respondGetImg(key, res);
            }
        });

        // Middleware and endpoints for vault management
        this.express.use('/manage', ManagerAuthentication);

        this.express.post(`/manage/${vaultKey}/:entryKey`, async (req, res) => {
            let key = req.params['entryKey'];
            let dto = req.body as MediaBinaryDto;

            if (key !== undefined && key !== '' && 
                key.length > 0 && dto !== undefined &&
                dto.size > 0 && dto.buffer !== undefined
            ) {
                let media = new MediaBinary(dto.buffer, dto.size);
                await this.respondPutImg(key, media, res);
            } else {
                FourOhFour(res);
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
                FourOhFour(res);
            }
        }
    }

    async respondPutImg(imgKey : string, media : MediaBinary, res: Express.Response) {
        if (await this.fileDB.registerResource('img', imgKey, media)) {
            res.type('application/json');
            res.statusCode = 200;
        } else {
            res.statusCode = 404;
        }
        res.end(null, 'utf-8');
    }

    
}

const ManagerAuthentication = async function(req : Express.Request, res : Express.Response, next : Express.NextFunction) {
    try {
        let apiKey = req.get('ApiKey');
        if (apiKey !== undefined && await passSecret('manager',apiKey)) {
            return next();
        }
    } catch (error) { 
        return FiveHundred(res, error);
    }
    return FourOhThree(res);
}

function FourOhThree(res : Express.Response) {
    res.type('application/json');
    res.statusCode = 403;
    res.end(null, 'utf-8');
}

function FourOhFour(res : Express.Response) {
    res.type('application/json');
    res.statusCode = 404;
    res.end(null, 'utf-8');
}

function FiveHundred(res : Express.Response, e : unknown) {
    let error = e as Error;

    res.type('application/json');
    res.statusCode = 500;
    res.end(null, 'utf-8');
}