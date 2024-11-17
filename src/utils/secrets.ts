import { fetchFile, fetchJSON } from "./fileDatabase.utils.js";

interface APIKeySet {
    APIKeys : string[];
}

export async function passSecret(vaultKey : string, secretKey : string) : Promise<boolean> {
    try {
        let json = await fetchJSON(`./.secrets/${vaultKey}.json`);
        let secret = JSON.parse(json) as APIKeySet;
        return secret.APIKeys?.includes(secretKey) ?? false;
    } catch (error) { }
    return false;
}