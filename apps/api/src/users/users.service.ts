import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
    private mailService: MailService,
    private auditService: AuditService,
  ) {}

  private sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async updateProfile(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    const currentProfile = (user.profile as Record<string, any>) || {};

    if (data.avatar) {
      await this.filesService.checkOwnership(data.avatar, userId, 'avatar');
    }

    const newProfile = {
      ...currentProfile,
      studentCode: typeof data.studentCode === 'string' ? data.studentCode.trim().slice(0, 50) : currentProfile.studentCode,
      school: typeof data.school === 'string' ? data.school.trim().slice(0, 200) : currentProfile.school,
      major: typeof data.major === 'string' ? data.major.trim().slice(0, 200) : currentProfile.major,
      graduation: data.graduation ? Number(data.graduation) : currentProfile.graduation,
      availability: ['looking', 'not_looking', 'employed'].includes(data.availability)
        ? data.availability
        : currentProfile.availability || 'looking',
      phone: typeof data.phone === 'string' ? data.phone.trim().slice(0, 30) : currentProfile.phone,
      about: typeof data.about === 'string' ? data.about.trim().slice(0, 2000) : currentProfile.about,
      avatar: data.avatar || currentProfile.avatar,
      emailPreferences: data.emailPreferences || currentProfile.emailPreferences || {},
    };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name ? data.name.trim().slice(0, 120) : user.name,
        profile: newProfile,
      },
    });

    await this.auditService.log('user', userId, 'update_profile', {}, userId);

    const { passwordHash, ...rest } = updatedUser;
    return rest;
  }

  async getSchoolVerification(userId: string) {
    const verification = await this.prisma.schoolVerification.findUnique({
      where: { userId },
    });
    return {
      verification: verification
        ? {
            email: verification.email,
            verified: verification.verifiedAt,
            expires: verification.expiresAt,
            attempts: verification.attempts,
          }
        : null,
      available: true,
    };
  }

  async sendSchoolVerificationOtp(userId: string, emailInput: string) {
    if (!emailInput || typeof emailInput !== 'string') {
      throw new BadRequestException('Vui lòng cung cấp email trường.');
    }

    const email = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@(?:[a-z0-9-]+\.)*edu\.vn$/.test(email)) {
      throw new BadRequestException('Hãy nhập email thuộc tên miền .edu.vn.');
    }

    const old = await this.prisma.schoolVerification.findUnique({
      where: { userId },
    });

    if (old && Date.now() - old.createdAt.getTime() < 60000) {
      throw new HttpException(
        'Vui lòng đợi một phút trước khi yêu cầu mã mới.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = this.sha256(`${userId}:${email}:${code}`);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const sent = await this.mailService.sendSchoolVerificationOtp(email, code);
    if (!sent) {
      throw new HttpException(
        'Dịch vụ email chưa gửi được mã. Vui lòng thử lại sau.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    await this.prisma.schoolVerification.upsert({
      where: { userId },
      create: {
        userId,
        email,
        hash: tokenHash,
        expiresAt,
        attempts: 0,
        verifiedAt: null,
      },
      update: {
        email,
        hash: tokenHash,
        expiresAt,
        attempts: 0,
        verifiedAt: null,
        createdAt: new Date(),
      },
    });

    return { ok: true, message: 'Đã gửi mã xác thực tới email trường.' };
  }

  async confirmSchoolVerificationOtp(userId: string, codeInput: string) {
    if (!codeInput || typeof codeInput !== 'string') {
      throw new BadRequestException('Vui lòng cung cấp mã xác thực.');
    }

    const code = codeInput.trim();
    const v = await this.prisma.schoolVerification.findUnique({
      where: { userId },
    });

    if (!v || v.expiresAt <= new Date() || v.attempts >= 5 || v.verifiedAt) {
      throw new HttpException(
        'Mã hết hạn, đã sử dụng hoặc vượt quá 5 lần thử. Hãy yêu cầu mã mới.',
        HttpStatus.CONFLICT,
      );
    }

    const h = this.sha256(`${userId}:${v.email}:${code}`);
    if (h !== v.hash) {
      await this.prisma.schoolVerification.update({
        where: { userId },
        data: { attempts: v.attempts + 1 },
      });
      throw new BadRequestException('Mã xác thực không chính xác.');
    }

    await this.prisma.schoolVerification.update({
      where: { userId },
      data: {
        verifiedAt: new Date(),
        attempts: v.attempts + 1,
      },
    });

    await this.auditService.log('user', userId, 'school_email_verified', { email: v.email }, userId);

    return { ok: true, message: 'Email trường đã được xác thực thành công.' };
  }
}
