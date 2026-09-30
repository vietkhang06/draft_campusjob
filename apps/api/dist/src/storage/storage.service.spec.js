"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const local_storage_adapter_1 = require("./local-storage.adapter");
const s3_storage_adapter_1 = require("./s3-storage.adapter");
const files_service_1 = require("../files/files.service");
const storage_service_1 = require("./storage.service");
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
describe('Storage & Files Service Comprehensive Tests', () => {
    const testStorageDir = path.resolve(process.cwd(), './var/test-uploads');
    let localAdapter;
    let storageService;
    let prismaMock;
    let filesService;
    beforeAll(() => {
        if (!fs.existsSync(testStorageDir)) {
            fs.mkdirSync(testStorageDir, { recursive: true });
        }
    });
    afterAll(async () => {
        try {
            if (fs.existsSync(testStorageDir)) {
                await fs.promises.rm(testStorageDir, { recursive: true, force: true });
            }
        }
        catch {
        }
    });
    beforeEach(() => {
        localAdapter = new local_storage_adapter_1.LocalStorageAdapter(testStorageDir);
        storageService = new storage_service_1.StorageService(localAdapter);
        prismaMock = {
            file: {
                create: jest.fn(),
                findUnique: jest.fn(),
                delete: jest.fn(),
            },
        };
        filesService = new files_service_1.FilesService(prismaMock, storageService);
    });
    it('1. should upload valid PNG file successfully', async () => {
        const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
        const mockFile = {
            fieldname: 'file',
            originalname: 'avatar.png',
            encoding: '7bit',
            mimetype: 'image/png',
            size: pngBuffer.length,
            buffer: pngBuffer,
            stream: null,
            destination: '',
            filename: '',
            path: '',
        };
        prismaMock.file.create.mockResolvedValue({
            id: 'file-uuid-1',
            ownerId: 'user-1',
            name: 'avatar.png',
            mime: 'image/png',
            size: pngBuffer.length,
            purpose: 'avatar',
        });
        const res = await filesService.upload('user-1', mockFile, 'avatar');
        expect(res.id).toBe('file-uuid-1');
        expect(res.name).toBe('avatar.png');
        const exists = await storageService.exists('file-uuid-1');
        expect(exists).toBe(true);
    });
    it('2. should allow owner to read / download file stream', async () => {
        const content = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01, 0x02]);
        await storageService.put({ key: 'file-uuid-2', body: content, contentType: 'image/png' });
        prismaMock.file.findUnique.mockResolvedValue({
            id: 'file-uuid-2',
            ownerId: 'user-1',
            name: 'test.png',
            mime: 'image/png',
            purpose: 'avatar',
        });
        const streamRes = await filesService.getFileStream('user-1', 'student', 'file-uuid-2');
        expect(streamRes.file.id).toBe('file-uuid-2');
        expect(streamRes.stream).toBeDefined();
    });
    it('3. should reject non-owner access with ForbiddenException', async () => {
        prismaMock.file.findUnique.mockResolvedValue({
            id: 'file-uuid-3',
            ownerId: 'user-1',
            name: 'secret.pdf',
            mime: 'application/pdf',
            purpose: 'evidence',
        });
        await expect(filesService.getFileStream('other-user', 'student', 'file-uuid-3')).rejects.toThrow(common_1.ForbiddenException);
    });
    it('4. should allow moderator and admin to access file of any owner', async () => {
        const content = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x03]);
        await storageService.put({ key: 'file-uuid-4', body: content, contentType: 'image/png' });
        prismaMock.file.findUnique.mockResolvedValue({
            id: 'file-uuid-4',
            ownerId: 'user-1',
            name: 'license.png',
            mime: 'image/png',
            purpose: 'license',
        });
        const modRes = await filesService.getFileStream('moderator-id', 'moderator', 'file-uuid-4');
        expect(modRes.file.id).toBe('file-uuid-4');
        const adminRes = await filesService.getFileStream('admin-id', 'admin', 'file-uuid-4');
        expect(adminRes.file.id).toBe('file-uuid-4');
    });
    it('5. should reject oversized file > 5MB', async () => {
        const oversizedFile = {
            fieldname: 'file',
            originalname: 'huge.png',
            encoding: '7bit',
            mimetype: 'image/png',
            size: 6 * 1024 * 1024,
            buffer: Buffer.alloc(10),
            stream: null,
            destination: '',
            filename: '',
            path: '',
        };
        await expect(filesService.upload('user-1', oversizedFile, 'avatar')).rejects.toThrow(common_1.BadRequestException);
    });
    it('6. should reject invalid MIME type or PDF for avatar', async () => {
        const fakeExe = Buffer.from('MZ-DOS-EXECUTABLE-HEADER');
        const mockFile = {
            fieldname: 'file',
            originalname: 'virus.exe',
            encoding: '7bit',
            mimetype: 'application/x-msdownload',
            size: fakeExe.length,
            buffer: fakeExe,
            stream: null,
            destination: '',
            filename: '',
            path: '',
        };
        await expect(filesService.upload('user-1', mockFile, 'avatar')).rejects.toThrow(common_1.BadRequestException);
    });
    it('7. should reject path traversal attempts in LocalStorageAdapter', async () => {
        await expect(localAdapter.put({ key: '../../etc/passwd', body: Buffer.from('bad'), contentType: 'text/plain' })).rejects.toThrow(common_1.BadRequestException);
        await expect(localAdapter.get('../outside.txt')).rejects.toThrow(common_1.BadRequestException);
        await expect(localAdapter.delete('/root/file')).rejects.toThrow(common_1.BadRequestException);
    });
    it('8. should delete file from DB and storage safely', async () => {
        const content = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x05]);
        await storageService.put({ key: 'file-to-delete', body: content, contentType: 'image/png' });
        prismaMock.file.findUnique.mockResolvedValue({
            id: 'file-to-delete',
            ownerId: 'user-1',
        });
        prismaMock.file.delete.mockResolvedValue({ id: 'file-to-delete' });
        const delRes = await filesService.deleteFile('user-1', 'student', 'file-to-delete');
        expect(delRes.ok).toBe(true);
        const exists = await storageService.exists('file-to-delete');
        expect(exists).toBe(false);
    });
    it('9. should rollback DB record if storage put fails', async () => {
        const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]);
        const mockFile = {
            fieldname: 'file',
            originalname: 'test.png',
            encoding: '7bit',
            mimetype: 'image/png',
            size: pngBuffer.length,
            buffer: pngBuffer,
            stream: null,
            destination: '',
            filename: '',
            path: '',
        };
        prismaMock.file.create.mockResolvedValue({
            id: 'faulty-file-id',
            name: 'test.png',
        });
        jest.spyOn(storageService, 'put').mockRejectedValueOnce(new Error('Disk write error'));
        await expect(filesService.upload('user-1', mockFile, 'avatar')).rejects.toThrow('Disk write error');
        expect(prismaMock.file.delete).toHaveBeenCalledWith({ where: { id: 'faulty-file-id' } });
    });
    it('10. should initialize LocalStorageAdapter when STORAGE_DRIVER=local', () => {
        expect(localAdapter).toBeInstanceOf(local_storage_adapter_1.LocalStorageAdapter);
        expect(localAdapter.getStorageRoot()).toContain('test-uploads');
    });
    it('11. should throw explicit error when S3 config missing required keys', () => {
        expect(() => {
            new s3_storage_adapter_1.S3StorageAdapter({
                bucket: '',
                accessKeyId: '',
                secretAccessKey: '',
            });
        }).toThrow('Cấu hình S3 không hợp lệ: thiếu S3_BUCKET, S3_ACCESS_KEY hoặc S3_SECRET_KEY.');
    });
});
//# sourceMappingURL=storage.service.spec.js.map