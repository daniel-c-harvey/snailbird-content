
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

        // VIEWING the vault media
        this.express.get(`/${vaultKey}/:entryKey`, async (req, res) => {
            await viewVaultGET(req, res, this.fileDB, vaultKey);
        });

        // Middleware and endpoints for vault management
        this.express.use('/manage', ManagerAuthentication);

        // MANAGING the vault media
        this.express.get(`/manage/${vaultKey}/:entryKey`, async (req, res) => {
            await managerVaultGET(req, res, this.fileDB, vaultKey);
        });
        this.express.post(`/manage/${vaultKey}/:entryKey`, async (req, res) => {
            await managerVaultPOST(req, res, this.fileDB, vaultKey);
        });
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

const viewVaultGET = async function(req : Express.Request, res : Express.Response, fileDB : FileDatabase, vaultKey : string) {
    let mediaKey = req.params['entryKey'];

    if (mediaKey !== undefined && mediaKey !== '' && mediaKey.length > 0) {
        try {
            let image = await fileDB.loadResource(vaultKey, mediaKey);
    
            if (image !== undefined && Buffer.isBuffer(image.buffer)) 
            {
                res.type('png');
                res.send(image.buffer);
                res.end(null, 'binary');
                return;
            }
        } catch (error) {
            FiveHundred(res, error);
            return;
        }
    } 
    FourOhFour(res);
    return;
}

const managerVaultGET = async function(req : Express.Request, res : Express.Response, fileDB : FileDatabase, vaultKey : string) {
    let mediaKey = req.params['entryKey'];

    if (mediaKey !== undefined && mediaKey !== '' && mediaKey.length > 0) {
        try {
            let media = await fileDB.loadResource(vaultKey, mediaKey);
            if (media !== undefined && Buffer.isBuffer(media.buffer)) 
            {
                let dto = new MediaBinaryDto(media);
                let json = JSON.stringify(dto);
                
                if (json?.length > 0) {
                    res.type('application/json');
                    res.statusCode = 200;
                    res.end(json, 'utf-8');
                    return;
                } else {
                    FiveHundred(res, 'Failed to encode response object');
                    return;
                }
            }
        } catch (error) {
            FiveHundred(res, error);
            return;
        }
    }
    FourOhFour(res);
    return;
}

const managerVaultPOST = async function(req : Express.Request, res : Express.Response, fileDB : FileDatabase, vaultKey : string) {
    let key = req.params['entryKey'];
    let dto = req.body as MediaBinaryDto;

    if (key !== undefined && key !== '' && 
        key.length > 0 && dto !== undefined &&
        dto.size > 0 && dto.bytes !== undefined
    ) {
        try {
            let media = MediaBinary.from(dto);
            if (await fileDB.registerResource(vaultKey, key, media)) {
                res.type('application/json');
                res.statusCode = 200;
                res.end(null, 'utf-8');
                return;
            }
        } catch (error) {
            FiveHundred(res, error);
            return;
        }
    }        
    FourOhFour(res);
    return;
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
    res.type('application/json');
    res.statusCode = 500;
    res.end(null, 'utf-8');
}