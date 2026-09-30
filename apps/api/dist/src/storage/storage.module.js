"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const storage_interface_1 = require("./storage.interface");
const storage_service_1 = require("./storage.service");
const local_storage_adapter_1 = require("./local-storage.adapter");
const s3_storage_adapter_1 = require("./s3-storage.adapter");
let StorageModule = class StorageModule {
};
exports.StorageModule = StorageModule;
exports.StorageModule = StorageModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: storage_interface_1.STORAGE_ADAPTER,
                useFactory: (config) => {
                    const driver = (config.get('storageDriver') || 'local').toLowerCase().trim();
                    if (driver === 'local') {
                        const localPath = config.get('localStoragePath') || './var/uploads';
                        return new local_storage_adapter_1.LocalStorageAdapter(localPath);
                    }
                    if (driver === 's3') {
                        const bucket = config.get('s3Bucket');
                        const accessKeyId = config.get('s3AccessKey');
                        const secretAccessKey = config.get('s3SecretKey');
                        if (!bucket || !accessKeyId || !secretAccessKey) {
                            throw new Error('Cấu hình S3 không hợp lệ: driver "s3" bắt buộc phải có S3_BUCKET, S3_ACCESS_KEY và S3_SECRET_KEY.');
                        }
                        return new s3_storage_adapter_1.S3StorageAdapter({
                            endpoint: config.get('s3Endpoint') || undefined,
                            region: config.get('s3Region') || 'us-east-1',
                            bucket,
                            accessKeyId,
                            secretAccessKey,
                            forcePathStyle: config.get('s3ForcePathStyle', true),
                        });
                    }
                    throw new Error(`Trình điều khiển lưu trữ không hợp lệ: "${driver}". Chỉ hỗ trợ "local" hoặc "s3".`);
                },
                inject: [config_1.ConfigService],
            },
            storage_service_1.StorageService,
        ],
        exports: [storage_service_1.StorageService, storage_interface_1.STORAGE_ADAPTER],
    })
], StorageModule);
//# sourceMappingURL=storage.module.js.map