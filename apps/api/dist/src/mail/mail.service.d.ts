import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private configService;
    private readonly logger;
    private transporter;
    private readonly from;
    private readonly webOrigin;
    constructor(configService: ConfigService);
    sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean>;
    sendVerificationEmail(to: string, token: string): Promise<boolean>;
    sendPasswordResetEmail(to: string, token: string): Promise<boolean>;
    sendSchoolVerificationOtp(to: string, code: string): Promise<boolean>;
}
