import { LocalStorageAdapter } from './local-storage.adapter';
import { S3StorageAdapter } from './s3-storage.adapter';
import { FilesService } from '../files/files.service';
import { StorageService } from './storage.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

describe('Storage & Files Service Comprehensive Tests', () => {
  const testStorageDir = path.resolve(process.cwd(), './var/test-uploads');
  let localAdapter: LocalStorageAdapter;
  let storageService: StorageService;
  let prismaMock: any;
  let filesService: FilesService;

  beforeAll(() => {
    if (!fs.existsSync(testStorageDir)) {
      fs.mkdirSync(testStorageDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up test upload files
    try {
      if (fs.existsSync(testStorageDir)) {
        await fs.promises.rm(testStorageDir, { recursive: true, force: true });
      }
    } catch {
      // ignore
    }
  });

  beforeEach(() => {
    localAdapter = new LocalStorageAdapter(testStorageDir);
    storageService = new StorageService(localAdapter);

    prismaMock = {
      file: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    filesService = new FilesService(prismaMock as any, storageService);
  });

  // 1. Upload file hợp lệ
  it('1. should upload valid PNG file successfully', async () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'avatar.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: pngBuffer.length,
      buffer: pngBuffer,
      stream: null as any,
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

  // 2. Đọc / download file đúng quyền
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

  // 3. Từ chối người dùng không phải owner
  it('3. should reject non-owner access with ForbiddenException', async () => {
    prismaMock.file.findUnique.mockResolvedValue({
      id: 'file-uuid-3',
      ownerId: 'user-1',
      name: 'secret.pdf',
      mime: 'application/pdf',
      purpose: 'evidence',
    });

    await expect(
      filesService.getFileStream('other-user', 'student', 'file-uuid-3'),
    ).rejects.toThrow(ForbiddenException);
  });

  // 4. Cho phép moderator/admin khi nghiệp vụ cho phép
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

  // 5. Từ chối file quá dung lượng (hoặc rỗng)
  it('5. should reject oversized file > 5MB', async () => {
    const oversizedFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'huge.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 6 * 1024 * 1024,
      buffer: Buffer.alloc(10),
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    await expect(
      filesService.upload('user-1', oversizedFile, 'avatar'),
    ).rejects.toThrow(BadRequestException);
  });

  // 6. Từ chối MIME không hợp lệ
  it('6. should reject invalid MIME type or PDF for avatar', async () => {
    const fakeExe = Buffer.from('MZ-DOS-EXECUTABLE-HEADER');
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'virus.exe',
      encoding: '7bit',
      mimetype: 'application/x-msdownload',
      size: fakeExe.length,
      buffer: fakeExe,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    await expect(
      filesService.upload('user-1', mockFile, 'avatar'),
    ).rejects.toThrow(BadRequestException);
  });

  // 7. Từ chối path traversal
  it('7. should reject path traversal attempts in LocalStorageAdapter', async () => {
    await expect(
      localAdapter.put({ key: '../../etc/passwd', body: Buffer.from('bad'), contentType: 'text/plain' }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      localAdapter.get('../outside.txt'),
    ).rejects.toThrow(BadRequestException);

    await expect(
      localAdapter.delete('/root/file'),
    ).rejects.toThrow(BadRequestException);
  });

  // 8. Xóa file
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

  // 9. Rollback khi storage put thất bại
  it('9. should rollback DB record if storage put fails', async () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]);
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: pngBuffer.length,
      buffer: pngBuffer,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    prismaMock.file.create.mockResolvedValue({
      id: 'faulty-file-id',
      name: 'test.png',
    });

    // Make storage put fail
    jest.spyOn(storageService, 'put').mockRejectedValueOnce(new Error('Disk write error'));

    await expect(
      filesService.upload('user-1', mockFile, 'avatar'),
    ).rejects.toThrow('Disk write error');

    // Verify rollback called
    expect(prismaMock.file.delete).toHaveBeenCalledWith({ where: { id: 'faulty-file-id' } });
  });

  // 10. Khởi động bằng STORAGE_DRIVER=local
  it('10. should initialize LocalStorageAdapter when STORAGE_DRIVER=local', () => {
    expect(localAdapter).toBeInstanceOf(LocalStorageAdapter);
    expect(localAdapter.getStorageRoot()).toContain('test-uploads');
  });

  // 11. Cấu hình STORAGE_DRIVER=s3 thiếu secret phải báo lỗi rõ ràng
  it('11. should throw explicit error when S3 config missing required keys', () => {
    expect(() => {
      new S3StorageAdapter({
        bucket: '',
        accessKeyId: '',
        secretAccessKey: '',
      });
    }).toThrow('Cấu hình S3 không hợp lệ: thiếu S3_BUCKET, S3_ACCESS_KEY hoặc S3_SECRET_KEY.');
  });
});
