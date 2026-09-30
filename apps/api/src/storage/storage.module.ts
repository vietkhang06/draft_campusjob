import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_ADAPTER } from './storage.interface';
import { StorageService } from './storage.service';
import { LocalStorageAdapter } from './local-storage.adapter';
import { S3StorageAdapter } from './s3-storage.adapter';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_ADAPTER,
      useFactory: (config: ConfigService) => {
        const driver = (config.get<string>('storageDriver') || 'local').toLowerCase().trim();

        if (driver === 'local') {
          const localPath = config.get<string>('localStoragePath') || './var/uploads';
          return new LocalStorageAdapter(localPath);
        }

        if (driver === 's3') {
          const bucket = config.get<string>('s3Bucket');
          const accessKeyId = config.get<string>('s3AccessKey');
          const secretAccessKey = config.get<string>('s3SecretKey');

          if (!bucket || !accessKeyId || !secretAccessKey) {
            throw new Error(
              'Cấu hình S3 không hợp lệ: driver "s3" bắt buộc phải có S3_BUCKET, S3_ACCESS_KEY và S3_SECRET_KEY.',
            );
          }

          return new S3StorageAdapter({
            endpoint: config.get<string>('s3Endpoint') || undefined,
            region: config.get<string>('s3Region') || 'us-east-1',
            bucket,
            accessKeyId,
            secretAccessKey,
            forcePathStyle: config.get<boolean>('s3ForcePathStyle', true),
          });
        }

        throw new Error(
          `Trình điều khiển lưu trữ không hợp lệ: "${driver}". Chỉ hỗ trợ "local" hoặc "s3".`,
        );
      },
      inject: [ConfigService],
    },
    StorageService,
  ],
  exports: [StorageService, STORAGE_ADAPTER],
})
export class StorageModule {}
