import { hash } from "../utils/sys.js";

export interface VaultIndex {
    uriKey : string;
    fileKeys : Set<string>;
}