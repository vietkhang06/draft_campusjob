import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CvsService {
  constructor(private prisma: PrismaService) {}

  async getMyCvs(studentId: string) {
    const cvs = await this.prisma.cV.findMany({
      where: { studentId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    return {
      cvs: cvs.map((c) => ({
        id: c.id,
        name: c.name,
        data: c.data,
        is_default: c.isDefault ? 1 : 0,
        created: c.createdAt.toISOString(),
        updated: c.updatedAt.toISOString(),
      })),
    };
  }

  async getCvById(studentId: string, cvId: string) {
    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, studentId },
    });
    if (!cv) {
      throw new NotFoundException('Không tìm thấy CV.');
    }
    return {
      id: cv.id,
      name: cv.name,
      data: cv.data,
      is_default: cv.isDefault ? 1 : 0,
      created: cv.createdAt.toISOString(),
      updated: cv.updatedAt.toISOString(),
    };
  }

  async saveCv(studentId: string, cvId: string | null, body: any) {
    const name = String(body.name || '').trim().slice(0, 150);
    if (!name) {
      throw new BadRequestException('Vui lòng nhập tên CV.');
    }

    const summary = String(body.summary || '').trim().slice(0, 3000);
    const education = String(body.education || '').trim().slice(0, 5000);
    const skills = String(body.skills || '').trim().slice(0, 2000);

    if (!summary || !education || !skills) {
      throw new BadRequestException('Vui lòng nhập đầy đủ mục tiêu, học vấn và kỹ năng.');
    }

    const portfolio = body.portfolio ? String(body.portfolio).trim().slice(0, 2000) : null;
    if (portfolio && !/^https?:\/\//i.test(portfolio)) {
      throw new BadRequestException('Liên kết portfolio phải bắt đầu bằng http:// hoặc https://.');
    }

    const cvData = {
      summary,
      skills,
      education,
      experience: typeof body.experience === 'string' ? body.experience.trim().slice(0, 10000) : '',
      projects: typeof body.projects === 'string' ? body.projects.trim().slice(0, 10000) : '',
      certificates: typeof body.certificates === 'string' ? body.certificates.trim().slice(0, 5000) : '',
      phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 30) : '',
      portfolio,
    };

    const isDefault = Boolean(body.is_default);

    if (cvId) {
      const existing = await this.prisma.cV.findFirst({
        where: { id: cvId, studentId },
      });
      if (!existing) {
        throw new ForbiddenException('CV không thuộc tài khoản của bạn.');
      }

      await this.prisma.$transaction(async (tx) => {
        if (isDefault) {
          await tx.cV.updateMany({
            where: { studentId },
            data: { isDefault: false },
          });
        }
        await tx.cV.update({
          where: { id: cvId },
          data: {
            name,
            data: cvData,
            isDefault,
          },
        });
      });

      return { id: cvId };
    } else {
      let createdId = '';
      await this.prisma.$transaction(async (tx) => {
        if (isDefault) {
          await tx.cV.updateMany({
            where: { studentId },
            data: { isDefault: false },
          });
        }
        const created = await tx.cV.create({
          data: {
            studentId,
            name,
            data: cvData,
            isDefault,
          },
        });
        createdId = created.id;
      });

      return { id: createdId };
    }
  }

  async deleteCv(studentId: string, cvId: string) {
    const cv = await this.prisma.cV.findFirst({
      where: { id: cvId, studentId },
    });
    if (!cv) {
      throw new NotFoundException('CV không tồn tại.');
    }

    const applicationCount = await this.prisma.application.count({
      where: { cvId },
    });

    if (applicationCount > 0) {
      throw new ConflictException(
        'CV đã dùng ứng tuyển. Bạn có thể chỉnh sửa; bản đã nộp được giữ nguyên.',
      );
    }

    await this.prisma.cV.delete({
      where: { id: cvId },
    });

    return { ok: true };
  }
}
