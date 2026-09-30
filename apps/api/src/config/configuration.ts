export interface AppConfig {
  nodeEnv: string;
  port: number;
  webOrigin: string[];
  apiOrigin: string;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtAccessTtl: string;
  refreshTokenTtlDays: number;
  cookieSecure: boolean;
  cookieDomain?: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser?: string;
  smtpPassword?: string;
  mailFrom: string;
  storageDriver: 'local' | 's3';
  localStoragePath: string;
  s3Endpoint: string;
  s3Region: string;
  s3Bucket: string;
  s3AccessKey: string;
  s3SecretKey: string;
  s3ForcePathStyle: boolean;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  adminBootstrapPassword?: string;
}

export function validateEnvironment(): void {
  const requiredKeys = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
  ];

  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Cấu hình môi trường thiếu các biến bắt buộc: ${missing.join(', ')}`,
    );
  }

  const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase().trim();
  if (driver !== 'local' && driver !== 's3') {
    throw new Error(
      `Cấu hình STORAGE_DRIVER không hợp lệ: "${driver}". Chỉ chấp nhận "local" hoặc "s3".`,
    );
  }

  if (driver === 's3') {
    const s3Missing = ['S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY'].filter(
      (k) => !process.env[k],
    );
    if (s3Missing.length > 0) {
      throw new Error(
        `Cấu hình S3 thiếu các biến bắt buộc khi dùng driver "s3": ${s3Missing.join(', ')}`,
      );
    }
  }
}

export const validateEnv = validateEnvironment;

export default (): AppConfig => {
  validateEnvironment();

  const webOrigins = (process.env.WEB_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '4000', 10),
    webOrigin: webOrigins,
    apiOrigin: process.env.API_ORIGIN || 'http://localhost:4000',
    databaseUrl: process.env.DATABASE_URL || '',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'dev_secret',
    jwtAccessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10),
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
    smtpHost: process.env.SMTP_HOST || 'localhost',
    smtpPort: parseInt(process.env.SMTP_PORT || '1025', 10),
    smtpUser: process.env.SMTP_USER || undefined,
    smtpPassword: process.env.SMTP_PASSWORD || undefined,
    mailFrom: process.env.MAIL_FROM || 'no-reply@campusjob.local',
    storageDriver: (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3',
    localStoragePath: process.env.LOCAL_STORAGE_PATH || './var/uploads',
    s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    s3Region: process.env.S3_REGION || 'us-east-1',
    s3Bucket: process.env.S3_BUCKET || 'campusjob',
    s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    s3SecretKey: process.env.S3_SECRET_KEY || 'minioadminpassword',
    s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || undefined,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || undefined,
    adminBootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || undefined,
  };
};
