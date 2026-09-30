import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration, { validateEnv } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { BranchesModule } from './branches/branches.module';
import { JobsModule } from './jobs/jobs.module';
import { CvsModule } from './cvs/cvs.module';
import { ApplicationsModule } from './applications/applications.module';
import { InterviewsModule } from './interviews/interviews.module';
import { MessagesModule } from './messages/messages.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReportsModule } from './reports/reports.module';
import { ModerationModule } from './moderation/moderation.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FilesModule } from './files/files.module';
import { StorageModule } from './storage/storage.module';
import { PaymentsModule } from './payments/payments.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AppController } from './app.controller';

import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '../../.env'),
        path.resolve(process.cwd(), '../.env'),
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '../../../.env'),
        path.resolve(__dirname, '../../../../.env'),
      ],
      load: [configuration],
      validate: (config: Record<string, any>) => {
        validateEnv();
        return config;
      },
    }),
    PrismaModule,
    MailModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    BranchesModule,
    JobsModule,
    CvsModule,
    ApplicationsModule,
    InterviewsModule,
    MessagesModule,
    ReviewsModule,
    ReportsModule,
    ModerationModule,
    AdminModule,
    NotificationsModule,
    StorageModule,
    FilesModule,
    PaymentsModule,
    MaintenanceModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
