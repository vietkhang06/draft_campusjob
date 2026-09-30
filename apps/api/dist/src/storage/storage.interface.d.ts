import { Readable } from 'stream';
export interface StoragePutInput {
    key: string;
    body: Buffer;
    contentType: string;
}
export interface StorageGetOutput {
    body: Readable | Buffer;
    contentType: string;
    size?: number;
}
export interface StorageAdapter {
    put(input: StoragePutInput): Promise<void>;
    get(key: string): Promise<StorageGetOutput>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
}
export declare const STORAGE_ADAPTER = "STORAGE_ADAPTER";
