"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var S3StorageAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageAdapter = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
let S3StorageAdapter = S3StorageAdapter_1 = class S3StorageAdapter {
    logger = new common_1.Logger(S3StorageAdapter_1.name);
    s3;
    bucket;
    constructor(config) {
        if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
            throw new Error('Cấu hình S3 không hợp lệ: thiếu S3_BUCKET, S3_ACCESS_KEY hoặc S3_SECRET_KEY.');
        }
        this.bucket = config.bucket;
        this.s3 = new client_s3_1.S3Client({
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
    async initBucket() {
        try {
            await this.s3.send(new client_s3_1.HeadBucketCommand({ Bucket: this.bucket }));
        }
        catch {
            try {
                await this.s3.send(new client_s3_1.CreateBucketCommand({ Bucket: this.bucket }));
                this.logger.log(`Đã tạo S3 bucket: ${this.bucket}`);
            }
            catch (err) {
                this.logger.debug(`Kết quả tạo bucket: ${err.message}`);
            }
        }
    }
    async put(input) {
        await this.s3.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: input.key,
            Body: input.body,
            ContentType: input.contentType,
        }));
    }
    async get(key) {
        try {
            const response = await this.s3.send(new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }));
            return {
                body: response.Body,
                contentType: response.ContentType || 'application/octet-stream',
                size: response.ContentLength,
            };
        }
        catch (err) {
            if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
                throw new common_1.NotFoundException('Không tìm thấy tệp trong kho lưu trữ S3.');
            }
            throw err;
        }
    }
    async delete(key) {
        try {
            await this.s3.send(new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }));
        }
        catch (err) {
            this.logger.warn(`Lỗi khi xóa tệp "${key}" trên S3: ${err.message}`);
        }
    }
    async exists(key) {
        try {
            await this.s3.send(new client_s3_1.HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }));
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.S3StorageAdapter = S3StorageAdapter;
exports.S3StorageAdapter = S3StorageAdapter = S3StorageAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], S3StorageAdapter);
//# sourceMappingURL=s3-storage.adapter.js.map