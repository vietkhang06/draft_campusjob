import { StorageAdapter, StoragePutInput, StorageGetOutput } from './storage.interface';
export declare class StorageService {
    private readonly adapter;
    constructor(adapter: StorageAdapter);
    put(input: StoragePutInput): Promise<void>;
    get(key: string): Promise<StorageGetOutput>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
}
