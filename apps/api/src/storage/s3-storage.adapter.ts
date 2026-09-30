import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { StorageAdapter, StoragePutInput, StorageGetOutput } from './storage.interface';

export interface S3StorageConfig {
  endpoint?: string;
  region?: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(config: S3StorageConfig) {
    if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error(
        'Cấu hình S3 không hợp lệ: thiếu S3_BUCKET, S3_ACCESS_KEY hoặc S3_SECRET_KEY.',
      );
    }

    this.bucket = config.bucket;
    this.s3 = new S3Client({
      endpoint: config.endpoint || undefined,
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? true,
    });

    this.initBucket().catch((err) => {
      this.logger.warn(`Không thể khởi tạo hoặc xác minh bucket S3 "${this.bucket}": ${err.message}`);
    });
  }

  private async initBucket(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Đã tạo S3 bucket: ${this.bucket}`);
      } catch (err: any) {
        this.logger.debug(`Kết quả tạo bucket: ${err.message}`);
      }
    }
  }

  async put(input: StoragePutInput): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  async get(key: string): Promise<StorageGetOutput> {
    try {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      return {
        body: response.Body as Readable,
        contentType: response.ContentType || 'application/octet-stream',
        size: response.ContentLength,
      };
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
        throw new NotFoundException('Không tìm thấy tệp trong kho lưu trữ S3.');
      }
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (err: any) {
      this.logger.warn(`Lỗi khi xóa tệp "${key}" trên S3: ${err.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
