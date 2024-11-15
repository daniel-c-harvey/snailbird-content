import { hash } from "../utils/sys.js";

export interface VaultIndex {
    vaultKey : string;
    entryKeys : Set<string>;
}