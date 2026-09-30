import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;
  private readonly webOrigin: string;

  constructor(private configService: ConfigService) {
    this.from = this.configService.get<string>('mailFrom', 'no-reply@campusjob.local');
    const origins = this.configService.get<string[]>('webOrigin', ['http://localhost:3000']);
    this.webOrigin = origins[0] || 'http://localhost:3000';

    const host = this.configService.get<string>('smtpHost');
    const port = this.configService.get<number>('smtpPort', 1025);
    const user = this.configService.get<string>('smtpUser');
    const pass = this.configService.get<string>('smtpPassword');

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
    }
  }

  async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email not configured. Skipping sending to ${to} with subject "${subject}"`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text,
        html: html || text,
      });
      return true;
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      return false;
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const url = `${this.webOrigin}/verify-email?token=${encodeURIComponent(token)}`;
    const subject = 'Xác minh địa chỉ email của bạn · CampusJob';
    const text = `Xin chào,\n\nCảm ơn bạn đã đăng ký tài khoản trên CampusJob. Vui lòng bấm vào liên kết sau để xác minh email của bạn:\n${url}\n\nLiên kết này có hiệu lực trong vòng 24 giờ.\n\nTrân trọng,\nĐội ngũ CampusJob`;
    const html = `<p>Xin chào,</p><p>Cảm ơn bạn đã đăng ký tài khoản trên <strong>CampusJob</strong>.</p><p><a href="${url}" style="padding: 10px 18px; background: #2d7958; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">Xác minh địa chỉ email</a></p><p>Hoặc truy cập liên kết: <a href="${url}">${url}</a></p><p>Liên kết có hiệu lực trong vòng 24 giờ.</p>`;
    return this.sendEmail(to, subject, text, html);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const url = `${this.webOrigin}/reset-password?token=${encodeURIComponent(token)}`;
    const subject = 'Yêu cầu đặt lại mật khẩu · CampusJob';
    const text = `Xin chào,\n\nChúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản CampusJob của bạn. Vui lòng mở liên kết sau để thiết lập mật khẩu mới:\n${url}\n\nLiên kết này có hiệu lực trong vòng 1 giờ. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ CampusJob`;
    const html = `<p>Xin chào,</p><p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p><p><a href="${url}" style="padding: 10px 18px; background: #2d7958; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">Đặt lại mật khẩu</a></p><p>Hoặc truy cập: <a href="${url}">${url}</a></p><p>Liên kết có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, vui lòng bỏ qua thư này.</p>`;
    return this.sendEmail(to, subject, text, html);
  }

  async sendSchoolVerificationOtp(to: string, code: string): Promise<boolean> {
    const subject = 'Mã xác thực email trường · CampusJob';
    const text = `Mã xác thực của bạn: ${code}. Mã có hiệu lực 10 phút. Không chia sẻ mã với người khác.`;
    return this.sendEmail(to, subject, text);
  }
}
