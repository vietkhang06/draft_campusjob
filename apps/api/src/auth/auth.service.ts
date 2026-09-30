import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto, AllowedRegisterRole } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole, UserStatus } from '@campusjob/contracts';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTtlDays: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    this.refreshTtlDays = this.configService.get<number>('refreshTokenTtlDays', 30);
  }

  private sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    if (
      dto.role !== AllowedRegisterRole.STUDENT &&
      dto.role !== AllowedRegisterRole.EMPLOYER
    ) {
      throw new BadRequestException('Chỉ cho phép đăng ký tài khoản sinh viên hoặc doanh nghiệp.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng.');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{10,}$/;
    if (!dto.password || !passwordRegex.test(dto.password)) {
      throw new BadRequestException(
        'Mật khẩu phải có tối thiểu 10 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.',
      );
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
        role: dto.role as UserRole,
        status: 'pending_verification' as UserStatus,
        profile: {},
      },
    });

    // Create Email Verification Token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.sha256(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await this.mailService.sendVerificationEmail(user.email, rawToken);

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(
        `[DEV MODE] Tài khoản mới: ${user.email} | Token: ${rawToken} | Mã test: 123456`,
      );
    }

    return {
      message: 'Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác minh tài khoản.',
      user: this.sanitizeUser(user),
      ...(process.env.NODE_ENV !== 'production'
        ? {
            devTestCode: '123456',
            devVerificationToken: rawToken,
          }
        : {}),
    };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // Check account status
    if (user.status === 'suspended') {
      throw new ForbiddenException('Tài khoản đã bị đình chỉ hoạt động.');
    }

    if (user.status === 'locked') {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingMinutes = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / (60 * 1000),
        );
        throw new ForbiddenException(
          `Tài khoản đang bị khóa tạm thời do nhập sai quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`,
        );
      } else {
        // Unlock expired lock
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            status: 'active',
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });
      }
    }

    if (user.status === 'pending_verification') {
      throw new ForbiddenException(
        'Tài khoản chưa được xác minh email. Vui lòng kiểm tra email để kích hoạt hoặc yêu cầu gửi lại mã.',
      );
    }

    const isMatch = await argon2.verify(user.passwordHash, dto.password);
    if (!isMatch) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };

      if (attempts >= 5) {
        updateData.status = 'locked';
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        await this.prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
        throw new ForbiddenException(
          'Tài khoản đã bị khóa tạm thời 15 phút do nhập sai mật khẩu 5 lần liên tiếp.',
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // Login successful: reset failed attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Create session and tokens
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.sha256(rawRefreshToken);
    const tokenFamily = uuidv4();
    const expiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);

    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash,
        tokenFamily,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async refresh(refreshToken: string, userAgent?: string, ipAddress?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token.');
    }

    const tokenHash = this.sha256(refreshToken);
    const session = await this.prisma.authSession.findFirst({
      where: { tokenHash },
    });

    if (!session) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }

    // Reuse detection: If session was already revoked, revoke the entire family!
    if (session.revokedAt !== null) {
      this.logger.warn(`Refresh token reuse detected for family ${session.tokenFamily}! Revoking all sessions.`);
      await this.prisma.authSession.updateMany({
        where: { tokenFamily: session.tokenFamily },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Phát hiện hành vi sử dụng lại token đã thu hồi. Tất cả phiên đăng nhập liên quan đã bị hủy.',
      );
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    // Revoke old session
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Issue new session in the same token family
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = this.sha256(newRefreshToken);
    const expiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);

    const newSession = await this.prisma.authSession.create({
      data: {
        userId: session.userId,
        tokenHash: newTokenHash,
        tokenFamily: session.tokenFamily,
        userAgent,
        ipAddress,
        expiresAt,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || user.status === 'suspended') {
      throw new ForbiddenException('Tài khoản không hợp lệ hoặc đã bị khóa.');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: newSession.id,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.sha256(refreshToken);
      await this.prisma.authSession.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { ok: true };
  }

  async logoutAll(userId: string) {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  async verifyEmail(token: string, email?: string) {
    if (!token) {
      throw new BadRequestException('Mã xác minh không hợp lệ.');
    }

    const cleanToken = token.trim();
    const isDev = process.env.NODE_ENV !== 'production';
    const devTestCodes = ['123456', 'TEST123', '999999'];
    if (process.env.DEV_VERIFICATION_CODE) {
      devTestCodes.push(process.env.DEV_VERIFICATION_CODE.trim().toUpperCase());
    }

    // Bypass verification with test code in development environment
    if (isDev && devTestCodes.includes(cleanToken.toUpperCase())) {
      let user: any = null;
      if (email && email.trim()) {
        user = await this.prisma.user.findUnique({
          where: { email: email.trim().toLowerCase() },
        });
      } else {
        // If email not explicitly provided, find the latest account pending verification
        user = await this.prisma.user.findFirst({
          where: { status: 'pending_verification' },
          orderBy: { createdAt: 'desc' },
        });
      }

      if (!user) {
        throw new BadRequestException(
          email
            ? `Không tìm thấy tài khoản với email "${email}".`
            : 'Không tìm thấy tài khoản nào đang chờ xác minh.',
        );
      }

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerifiedAt: new Date(),
            status: user.status === 'pending_verification' ? 'active' : user.status,
          },
        }),
        this.prisma.emailVerificationToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        }),
      ]);

      return {
        message: `Xác minh thành công cho tài khoản ${user.email} bằng mã test (${cleanToken})! Bây giờ bạn có thể đăng nhập.`,
        user: this.sanitizeUser(user),
      };
    }

    const tokenHash = this.sha256(cleanToken);
    const tokenRecord = await this.prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Mã xác minh không hợp lệ hoặc đã hết hạn.');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          emailVerifiedAt: new Date(),
          status: tokenRecord.user.status === 'pending_verification' ? 'active' : tokenRecord.user.status,
        },
      }),
    ]);

    return { message: 'Xác minh email thành công! Bây giờ bạn có thể đăng nhập.' };
  }

  async resendVerification(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (user && !user.emailVerifiedAt && user.status !== 'suspended') {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.sha256(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await this.mailService.sendVerificationEmail(user.email, rawToken);
    }

    return {
      message: 'Nếu tài khoản tồn tại và chưa được xác minh, liên kết xác minh mới đã được gửi tới email của bạn.',
    };
  }

  async forgotPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (user && user.status !== 'suspended') {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.sha256(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await this.mailService.sendPasswordResetEmail(user.email, rawToken);
    }

    return {
      message: 'Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.sha256(dto.token);
    const resetRecord = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      throw new BadRequestException('Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
          status: 'active',
        },
      }),
      // Revoke all prior sessions on password reset
      this.prisma.authSession.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException('Tài khoản chưa có mật khẩu. Vui lòng sử dụng chức năng quên mật khẩu.');
    }

    const isMatch = await argon2.verify(user.passwordHash, dto.oldPassword);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác.');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      // Revoke all sessions
      this.prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Đổi mật khẩu thành công. Tất cả các phiên đăng nhập khác đã được thu hồi.' };
  }
}
