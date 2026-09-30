import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async upload(userId: string, file: Express.Multer.File, purpose: string) {
    if (!['avatar', 'license', 'evidence'].includes(purpose)) {
      throw new BadRequestException('Mục đích tải tệp không hợp lệ.');
    }

    if (!file || !file.buffer) {
      throw new BadRequestException('Vui lòng chọn tệp để tải lên.');
    }

    if (file.size > 5 * 1024 * 1024 || file.size === 0) {
      throw new BadRequestException('Tệp phải từ 1 byte đến 5 MB.');
    }

    const bytes = file.buffer;
    let mime = '';

    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      mime = 'image/png';
    } else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      mime = 'image/jpeg';
    } else if (bytes.subarray(0, 5).toString('ascii') === '%PDF-') {
      mime = 'application/pdf';
    }

    if (!mime || (purpose === 'avatar' && mime === 'application/pdf')) {
      throw new BadRequestException('Chỉ nhận định dạng PNG, JPEG hoặc PDF; ảnh đại diện phải là hình ảnh.');
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
    } catch (err: any) {
      this.logger.error(`Lỗi khi lưu trữ tệp ${fileRecord.id}, tiến hành rollback: ${err.message}`);
      try {
        await this.prisma.file.delete({ where: { id: fileRecord.id } });
      } catch (rollbackErr: any) {
        this.logger.error(`Rollback bản ghi CSDL thất bại cho tệp ${fileRecord.id}: ${rollbackErr.message}`);
      }
      throw err;
    }

    return { id: fileRecord.id, name: fileRecord.name };
  }

  async getFileStream(userId: string, userRole: string, fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('Tệp không tồn tại.');
    }

    if (file.ownerId !== userId && !['admin', 'moderator'].includes(userRole)) {
      throw new ForbiddenException('Bạn không có quyền đọc tệp này.');
    }

    try {
      const response = await this.storageService.get(file.id);

      return {
        stream: response.body as Readable,
        file,
      };
    } catch (err: any) {
      if (err instanceof NotFoundException) {
        throw new NotFoundException('Không tìm thấy nội dung tệp trong kho lưu trữ.');
      }
      throw err;
    }
  }

  async deleteFile(userId: string, userRole: string, fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('Tệp không tồn tại.');
    }

    if (file.ownerId !== userId && !['admin', 'moderator'].includes(userRole)) {
      throw new ForbiddenException('Bạn không có quyền xóa tệp này.');
    }

    try {
      await this.prisma.file.delete({ where: { id: fileId } });
    } catch (err: any) {
      this.logger.error(`Lỗi khi xóa bản ghi tệp ${fileId} trong CSDL: ${err.message}`);
      throw err;
    }

    try {
      await this.storageService.delete(fileId);
    } catch (err: any) {
      this.logger.warn(`Lỗi khi xóa tệp vật lý ${fileId} khỏi kho lưu trữ: ${err.message}`);
    }

    return { ok: true, message: 'Đã xóa tệp thành công.' };
  }

  async checkOwnership(fileId: string, userId: string, purpose?: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.ownerId !== userId || (purpose && file.purpose !== purpose)) {
      throw new BadRequestException('Tệp đính kèm không hợp lệ hoặc không thuộc quyền sở hữu.');
    }

    return file;
  }
}
