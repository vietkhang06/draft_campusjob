import { StorageAdapter, StoragePutInput, StorageGetOutput } from './storage.interface';
export interface S3StorageConfig {
    endpoint?: string;
    region?: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle?: boolean;
}
export declare class S3StorageAdapter implements StorageAdapter {
    private readonly logger;
    private readonly s3;
    private readonly bucket;
    constructor(config: S3StorageConfig);
    private initBucket;
    put(input: StoragePutInput): Promise<void>;
    get(key: string): Promise<StorageGetOutput>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
}
