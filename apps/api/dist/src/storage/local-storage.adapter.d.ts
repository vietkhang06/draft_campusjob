import { StorageAdapter, StoragePutInput, StorageGetOutput } from './storage.interface';
export declare class LocalStorageAdapter implements StorageAdapter {
    private readonly logger;
    private readonly storageRoot;
    constructor(customPath?: string);
    private ensureStorageRoot;
    private resolveSafePath;
    put(input: StoragePutInput): Promise<void>;
    get(key: string): Promise<StorageGetOutput>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    getStorageRoot(): string;
}
