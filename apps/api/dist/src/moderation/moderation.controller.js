"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationController = void 0;
const common_1 = require("@nestjs/common");
const moderation_service_1 = require("./moderation.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ModerationController = class ModerationController {
    moderationService;
    constructor(moderationService) {
        this.moderationService = moderationService;
    }
    async getQueue() {
        return this.moderationService.getQueue();
    }
    async moderateJob(user, jobId, body) {
        return this.moderationService.moderateJob(jobId, user, body);
    }
    async moderateReport(user, reportId, body) {
        return this.moderationService.moderateReport(reportId, user, body);
    }
    async moderateReview(user, reviewId, body) {
        return this.moderationService.moderateReview(reviewId, user, body);
    }
};
exports.ModerationController = ModerationController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "getQueue", null);
__decorate([
    (0, common_1.Post)(':id/job'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "moderateJob", null);
__decorate([
    (0, common_1.Post)(':id/report'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "moderateReport", null);
__decorate([
    (0, common_1.Post)(':id/review'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "moderateReview", null);
exports.ModerationController = ModerationController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('moderator', 'admin'),
    (0, common_1.Controller)('moderation'),
    __metadata("design:paramtypes", [moderation_service_1.ModerationService])
], ModerationController);
//# sourceMappingURL=moderation.controller.js.map