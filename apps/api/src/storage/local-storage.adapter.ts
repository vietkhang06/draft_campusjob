import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { StorageAdapter, StoragePutInput, StorageGetOutput } from './storage.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(LocalStorageAdapter.name);
  private readonly storageRoot: string;

  constructor(customPath?: string) {
    const rawPath = customPath || process.env.LOCAL_STORAGE_PATH || './var/uploads';
    this.storageRoot = path.isAbsolute(rawPath)
      ? path.normalize(rawPath)
      : path.resolve(process.cwd(), rawPath);

    this.ensureStorageRoot();
  }

  private ensureStorageRoot(): void {
    try {
      if (!fs.existsSync(this.storageRoot)) {
        fs.mkdirSync(this.storageRoot, { recursive: true });
        this.logger.log(`Tạo thư mục lưu trữ cục bộ: ${this.storageRoot}`);
      }
    } catch (err: any) {
      this.logger.error(`Không thể tạo thư mục lưu trữ cục bộ: ${err.message}`);
    }
  }

  private resolveSafePath(key: string): string {
    if (!key || typeof key !== 'string') {
      throw new BadRequestException('Mã tệp lưu trữ không hợp lệ.');
    }

    // Path traversal defense: reject dangerous sequences
    if (key.includes('..') || path.isAbsolute(key) || key.includes('/') || key.includes('\\')) {
      throw new BadRequestException('Khóa lưu trữ không hợp lệ (phát hiện ký tự nguy hiểm).');
    }

    const resolved = path.resolve(this.storageRoot, key);

    // Verify resolved path strictly resides inside storageRoot
    if (!resolved.startsWith(this.storageRoot + path.sep) && resolved !== this.storageRoot) {
      throw new BadRequestException('Truy cập tệp nằm ngoài thư mục lưu trữ được cho phép.');
    }

    return resolved;
  }

  async put(input: StoragePutInput): Promise<void> {
    const filePath = this.resolveSafePath(input.key);
    const metaPath = `${filePath}.meta`;

    await fs.promises.writeFile(filePath, input.body);
    await fs.promises.writeFile(
      metaPath,
      JSON.stringify({
        contentType: input.contentType,
        size: input.body.length,
        createdAt: new Date().toISOString(),
      }),
      'utf8',
    );
  }

  async get(key: string): Promise<StorageGetOutput> {
    const filePath = this.resolveSafePath(key);
    const metaPath = `${filePath}.meta`;

    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch {
      throw new NotFoundException('Không tìm thấy tệp trong kho lưu trữ cục bộ.');
    }

    let contentType = 'application/octet-stream';
    let size: number | undefined;

    try {
      const metaContent = await fs.promises.readFile(metaPath, 'utf8');
      const meta = JSON.parse(metaContent);
      contentType = meta.contentType || contentType;
      size = meta.size;
    } catch {
      // If meta missing, fallback to stat
      const stat = await fs.promises.stat(filePath);
      size = stat.size;
    }

    const stream = fs.createReadStream(filePath);
    return {
      body: stream,
      contentType,
      size,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolveSafePath(key);
    const metaPath = `${filePath}.meta`;

    try {
      await fs.promises.unlink(filePath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        this.logger.warn(`Lỗi khi xóa tệp ${filePath}: ${err.message}`);
      }
    }

    try {
      await fs.promises.unlink(metaPath);
    } catch {
      // ignore missing meta
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.resolveSafePath(key);
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  getStorageRoot(): string {
    return this.storageRoot;
  }
}
