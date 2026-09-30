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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    configService;
    logger = new common_1.Logger(MailService_1.name);
    transporter = null;
    from;
    webOrigin;
    constructor(configService) {
        this.configService = configService;
        this.from = this.configService.get('mailFrom', 'no-reply@campusjob.local');
        const origins = this.configService.get('webOrigin', ['http://localhost:3000']);
        this.webOrigin = origins[0] || 'http://localhost:3000';
        const host = this.configService.get('smtpHost');
        const port = this.configService.get('smtpPort', 1025);
        const user = this.configService.get('smtpUser');
        const pass = this.configService.get('smtpPassword');
        if (host) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: user && pass ? { user, pass } : undefined,
            });
        }
    }
    async sendEmail(to, subject, text, html) {
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
        }
        catch (err) {
            this.logger.error(`Failed to send email to ${to}: ${err.message}`);
            return false;
        }
    }
    async sendVerificationEmail(to, token) {
        const url = `${this.webOrigin}/verify-email?token=${encodeURIComponent(token)}`;
        const subject = 'Xác minh địa chỉ email của bạn · CampusJob';
        const text = `Xin chào,\n\nCảm ơn bạn đã đăng ký tài khoản trên CampusJob. Vui lòng bấm vào liên kết sau để xác minh email của bạn:\n${url}\n\nLiên kết này có hiệu lực trong vòng 24 giờ.\n\nTrân trọng,\nĐội ngũ CampusJob`;
        const html = `<p>Xin chào,</p><p>Cảm ơn bạn đã đăng ký tài khoản trên <strong>CampusJob</strong>.</p><p><a href="${url}" style="padding: 10px 18px; background: #2d7958; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">Xác minh địa chỉ email</a></p><p>Hoặc truy cập liên kết: <a href="${url}">${url}</a></p><p>Liên kết có hiệu lực trong vòng 24 giờ.</p>`;
        return this.sendEmail(to, subject, text, html);
    }
    async sendPasswordResetEmail(to, token) {
        const url = `${this.webOrigin}/reset-password?token=${encodeURIComponent(token)}`;
        const subject = 'Yêu cầu đặt lại mật khẩu · CampusJob';
        const text = `Xin chào,\n\nChúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản CampusJob của bạn. Vui lòng mở liên kết sau để thiết lập mật khẩu mới:\n${url}\n\nLiên kết này có hiệu lực trong vòng 1 giờ. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.\n\nTrân trọng,\nĐội ngũ CampusJob`;
        const html = `<p>Xin chào,</p><p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p><p><a href="${url}" style="padding: 10px 18px; background: #2d7958; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">Đặt lại mật khẩu</a></p><p>Hoặc truy cập: <a href="${url}">${url}</a></p><p>Liên kết có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, vui lòng bỏ qua thư này.</p>`;
        return this.sendEmail(to, subject, text, html);
    }
    async sendSchoolVerificationOtp(to, code) {
        const subject = 'Mã xác thực email trường · CampusJob';
        const text = `Mã xác thực của bạn: ${code}. Mã có hiệu lực 10 phút. Không chia sẻ mã với người khác.`;
        return this.sendEmail(to, subject, text);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map