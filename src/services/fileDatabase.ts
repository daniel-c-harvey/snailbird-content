import * as Path from 'path';
import { MediaBinary, ImageBinary } from '../models/mediaModel.js';;
import { streamFile } from '../utils/sys.js';

abstract class IndexDirectory {
    rootPath : string;
    index : VaultIndex | undefined;

    protected constructor(rootPath : string) {
        this.rootPath = rootPath;
    }

    async loadIndexAsync(vaultKey : string) : Promise<VaultIndex | undefined>
    {        
        try { 
            let index = await streamFile(this.rootPath + '/' + vaultKey);
        } 
        catch (e : unknown) {  
            console.log(`Creating Index for ${vaultKey}.`);
        }

        return new Promise(resolve => {
            // load the index file, and throw an error if there isn't one
            let x;
            if (indexFH !== undefined) {
                x = { id : 0, uriKey : vaultKey, fileHashes : new Set<string>() };
            }
            resolve(x);
        });
    }
}

export class FileDatabase extends IndexDirectory
{
    vaults : Map<string, DirectoryVault>;
    
    static async from(rootPath : string) : Promise<FileDatabase> {
        let db = new FileDatabase(rootPath);
        await db.initVaults();
        return db;
    }

    protected constructor(rootPath : string)
    {
        super(rootPath);
        this.vaults = new Map<string, DirectoryVault>();
    }

    protected async initVaults() {
        this.index = await this.loadIndexAsync(this.rootPath);

        await this.initVault('img', new ImageVault());
        // this.loadVault('aud', new AudioVault());
    }

    protected async initVault(vaultKey : string, vault : Vault) {
        let dvault = await DirectoryVault.from(vaultKey, vault);
        if (dvault.index !== undefined) {
            this.vaults.set(dvault.index.uriKey, dvault);
        }
    }

    loadResource(vaultKey : string, path : string): Promise<MediaBinary> | undefined {
        let dvault : DirectoryVault | undefined = this.vaults.get(vaultKey);
        if (dvault !== undefined)
        {
            let vault : Vault | undefined = dvault.vault;
            if (vault !== undefined)
            {
                return vault.getMediaAsync(this.rootPath + '/' + dvault.rootPath + '/' + path);
            }
        }
        return undefined;
    }
}

class DirectoryVault extends IndexDirectory {
    vault : Vault;

    static async from(rootPath : string, vault : Vault) : Promise<DirectoryVault> {
        let dv = new DirectoryVault(rootPath, vault);
        await dv.loadIndexAsync(rootPath);
        return new Promise<DirectoryVault>(resolve => resolve(dv));
    }

    private constructor(rootPath : string, vault : Vault) {
        super(rootPath);
        this.vault = vault;
    }
}

interface VaultIndex {
    id : number;
    uriKey : string;
    fileHashes : Set<string>;
}

abstract class Vault {
    async getMediaAsync(mediaPath: string): Promise<MediaBinary> {
        return streamFile(mediaPath);
    }
}

export class ImageVault extends Vault {
    override async getMediaAsync(mediaPath: string): Promise<ImageBinary> {
        const extension = Path.extname(mediaPath);
        let mediaBinary = await super.getMediaAsync(mediaPath);

        return new Promise<ImageBinary>(
            resolve => resolve(
            {
                'buffer' : mediaBinary.buffer,
                'size' : mediaBinary.size,
                'extension' : extension
            }
        ));
    }
}