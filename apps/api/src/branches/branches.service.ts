import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async getBranches(userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId: userId },
    });
    if (!company) {
      throw new NotFoundException('Chưa có hồ sơ doanh nghiệp.');
    }

    return this.prisma.branch.findMany({
      where: { companyId: company.id },
    });
  }

  async saveBranch(userId: string, branchId: string | null, data: any) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId: userId },
    });
    if (!company) {
      throw new NotFoundException('Chưa có hồ sơ doanh nghiệp.');
    }
    if (company.status === 'suspended') {
      throw new ForbiddenException('Doanh nghiệp đã bị đình chỉ hoạt động.');
    }

    const name = String(data.name || '').trim().slice(0, 150);
    const address = String(data.address || '').trim().slice(0, 500);
    const city = String(data.city || '').trim().slice(0, 100);

    if (!name || !address || !city) {
      throw new BadRequestException('Vui lòng nhập đầy đủ tên chi nhánh, địa chỉ và tỉnh/thành phố.');
    }

    const lat = data.lat !== '' && data.lat != null ? Number(data.lat) : null;
    const lng = data.lng !== '' && data.lng != null ? Number(data.lng) : null;

    if ((lat === null) !== (lng === null)) {
      throw new BadRequestException('Cần nhập cả vĩ độ và kinh độ hoặc để trống cả hai.');
    }
    if (lat !== null && (lat < -90 || lat > 90 || lng! < -180 || lng! > 180)) {
      throw new BadRequestException('Tọa độ địa lý không hợp lệ.');
    }

    if (branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: branchId, companyId: company.id },
      });
      if (!branch) {
        throw new ForbiddenException('Chi nhánh không thuộc doanh nghiệp của bạn.');
      }

      await this.prisma.$transaction([
        this.prisma.branch.update({
          where: { id: branchId },
          data: { name, address, city, lat, lng },
        }),
        // When modifying branch location, return active jobs to pending for re-moderation
        this.prisma.job.updateMany({
          where: {
            branchId,
            status: { in: ['open', 'paused'] },
          },
          data: { status: 'pending' },
        }),
      ]);

      return { id: branchId };
    } else {
      const newBranch = await this.prisma.branch.create({
        data: {
          companyId: company.id,
          name,
          address,
          city,
          lat,
          lng,
        },
      });
      return { id: newBranch.id };
    }
  }

  async deleteBranch(userId: string, branchId: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId: userId },
    });
    if (!company) {
      throw new NotFoundException('Chưa có hồ sơ doanh nghiệp.');
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, companyId: company.id },
    });
    if (!branch) {
      throw new NotFoundException('Chi nhánh không tồn tại.');
    }

    const jobCount = await this.prisma.job.count({
      where: { branchId },
    });
    if (jobCount > 0) {
      throw new ConflictException('Chi nhánh đã gắn với tin tuyển dụng, không thể xóa.');
    }

    await this.prisma.branch.delete({
      where: { id: branchId },
    });

    return { ok: true };
  }
}
