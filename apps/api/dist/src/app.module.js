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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const configuration_1 = __importStar(require("./config/configuration"));
const prisma_module_1 = require("./prisma/prisma.module");
const mail_module_1 = require("./mail/mail.module");
const audit_module_1 = require("./audit/audit.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const companies_module_1 = require("./companies/companies.module");
const branches_module_1 = require("./branches/branches.module");
const jobs_module_1 = require("./jobs/jobs.module");
const cvs_module_1 = require("./cvs/cvs.module");
const applications_module_1 = require("./applications/applications.module");
const interviews_module_1 = require("./interviews/interviews.module");
const messages_module_1 = require("./messages/messages.module");
const reviews_module_1 = require("./reviews/reviews.module");
const reports_module_1 = require("./reports/reports.module");
const moderation_module_1 = require("./moderation/moderation.module");
const admin_module_1 = require("./admin/admin.module");
const notifications_module_1 = require("./notifications/notifications.module");
const files_module_1 = require("./files/files.module");
const storage_module_1 = require("./storage/storage.module");
const payments_module_1 = require("./payments/payments.module");
const maintenance_module_1 = require("./maintenance/maintenance.module");
const app_controller_1 = require("./app.controller");
const path = __importStar(require("path"));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    path.resolve(process.cwd(), '../../.env'),
                    path.resolve(process.cwd(), '../.env'),
                    path.resolve(process.cwd(), '.env'),
                    path.resolve(__dirname, '../../../.env'),
                    path.resolve(__dirname, '../../../../.env'),
                ],
                load: [configuration_1.default],
                validate: (config) => {
                    (0, configuration_1.validateEnv)();
                    return config;
                },
            }),
            prisma_module_1.PrismaModule,
            mail_module_1.MailModule,
            audit_module_1.AuditModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            companies_module_1.CompaniesModule,
            branches_module_1.BranchesModule,
            jobs_module_1.JobsModule,
            cvs_module_1.CvsModule,
            applications_module_1.ApplicationsModule,
            interviews_module_1.InterviewsModule,
            messages_module_1.MessagesModule,
            reviews_module_1.ReviewsModule,
            reports_module_1.ReportsModule,
            moderation_module_1.ModerationModule,
            admin_module_1.AdminModule,
            notifications_module_1.NotificationsModule,
            storage_module_1.StorageModule,
            files_module_1.FilesModule,
            payments_module_1.PaymentsModule,
            maintenance_module_1.MaintenanceModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map