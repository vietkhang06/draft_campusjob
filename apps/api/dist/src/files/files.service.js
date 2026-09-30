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
var FilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
let FilesService = FilesService_1 = class FilesService {
    prisma;
    storageService;
    logger = new common_1.Logger(FilesService_1.name);
    constructor(prisma, storageService) {
        this.prisma = prisma;
        this.storageService = storageService;
    }
    async upload(userId, file, purpose) {
        if (!['avatar', 'license', 'evidence'].includes(purpose)) {
            throw new common_1.BadRequestException('Mục đích tải tệp không hợp lệ.');
        }
        if (!file || !file.buffer) {
            throw new common_1.BadRequestException('Vui lòng chọn tệp để tải lên.');
        }
        if (file.size > 5 * 1024 * 1024 || file.size === 0) {
            throw new common_1.BadRequestException('Tệp phải từ 1 byte đến 5 MB.');
        }
        const bytes = file.buffer;
        let mime = '';
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
            mime = 'image/png';
        }
        else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
            mime = 'image/jpeg';
        }
        else if (bytes.subarray(0, 5).toString('ascii') === '%PDF-') {
            mime = 'application/pdf';
        }
        if (!mime || (purpose === 'avatar' && mime === 'application/pdf')) {
            throw new common_1.BadRequestException('Chỉ nhận định dạng PNG, JPEG hoặc PDF; ảnh đại diện phải là hình ảnh.');
        }
        const fileRecord = await this.prisma.file.create({
            data: {
                ownerId: userId,
                name: file.originalname.slice(0, 180),
                mime,
                size: file.size,
                purpose,
            },
        });
        try {
            await this.storageService.put({
                key: fileRecord.id,
                body: file.buffer,
                contentType: mime,
            });
        }
        catch (err) {
            this.logger.error(`Lỗi khi lưu trữ tệp ${fileRecord.id}, tiến hành rollback: ${err.message}`);
            try {
                await this.prisma.file.delete({ where: { id: fileRecord.id } });
            }
            catch (rollbackErr) {
                this.logger.error(`Rollback bản ghi CSDL thất bại cho tệp ${fileRecord.id}: ${rollbackErr.message}`);
            }
            throw err;
        }
        return { id: fileRecord.id, name: fileRecord.name };
    }
    async getFileStream(userId, userRole, fileId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('Tệp không tồn tại.');
        }
        if (file.ownerId !== userId && !['admin', 'moderator'].includes(userRole)) {
            throw new common_1.ForbiddenException('Bạn không có quyền đọc tệp này.');
        }
        try {
            const response = await this.storageService.get(file.id);
            return {
                stream: response.body,
                file,
            };
        }
        catch (err) {
            if (err instanceof common_1.NotFoundException) {
                throw new common_1.NotFoundException('Không tìm thấy nội dung tệp trong kho lưu trữ.');
            }
            throw err;
        }
    }
    async deleteFile(userId, userRole, fileId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('Tệp không tồn tại.');
        }
        if (file.ownerId !== userId && !['admin', 'moderator'].includes(userRole)) {
            throw new common_1.ForbiddenException('Bạn không có quyền xóa tệp này.');
        }
        try {
            await this.prisma.file.delete({ where: { id: fileId } });
        }
        catch (err) {
            this.logger.error(`Lỗi khi xóa bản ghi tệp ${fileId} trong CSDL: ${err.message}`);
            throw err;
        }
        try {
            await this.storageService.delete(fileId);
        }
        catch (err) {
            this.logger.warn(`Lỗi khi xóa tệp vật lý ${fileId} khỏi kho lưu trữ: ${err.message}`);
        }
        return { ok: true, message: 'Đã xóa tệp thành công.' };
    }
    async checkOwnership(fileId, userId, purpose) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file || file.ownerId !== userId || (purpose && file.purpose !== purpose)) {
            throw new common_1.BadRequestException('Tệp đính kèm không hợp lệ hoặc không thuộc quyền sở hữu.');
        }
        return file;
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = FilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], FilesService);
//# sourceMappingURL=files.service.js.map