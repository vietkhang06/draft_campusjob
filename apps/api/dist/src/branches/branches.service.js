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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BranchesService = class BranchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBranches(userId) {
        const company = await this.prisma.company.findUnique({
            where: { ownerId: userId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Chưa có hồ sơ doanh nghiệp.');
        }
        return this.prisma.branch.findMany({
            where: { companyId: company.id },
        });
    }
    async saveBranch(userId, branchId, data) {
        const company = await this.prisma.company.findUnique({
            where: { ownerId: userId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Chưa có hồ sơ doanh nghiệp.');
        }
        if (company.status === 'suspended') {
            throw new common_1.ForbiddenException('Doanh nghiệp đã bị đình chỉ hoạt động.');
        }
        const name = String(data.name || '').trim().slice(0, 150);
        const address = String(data.address || '').trim().slice(0, 500);
        const city = String(data.city || '').trim().slice(0, 100);
        if (!name || !address || !city) {
            throw new common_1.BadRequestException('Vui lòng nhập đầy đủ tên chi nhánh, địa chỉ và tỉnh/thành phố.');
        }
        const lat = data.lat !== '' && data.lat != null ? Number(data.lat) : null;
        const lng = data.lng !== '' && data.lng != null ? Number(data.lng) : null;
        if ((lat === null) !== (lng === null)) {
            throw new common_1.BadRequestException('Cần nhập cả vĩ độ và kinh độ hoặc để trống cả hai.');
        }
        if (lat !== null && (lat < -90 || lat > 90 || lng < -180 || lng > 180)) {
            throw new common_1.BadRequestException('Tọa độ địa lý không hợp lệ.');
        }
        if (branchId) {
            const branch = await this.prisma.branch.findFirst({
                where: { id: branchId, companyId: company.id },
            });
            if (!branch) {
                throw new common_1.ForbiddenException('Chi nhánh không thuộc doanh nghiệp của bạn.');
            }
            await this.prisma.$transaction([
                this.prisma.branch.update({
                    where: { id: branchId },
                    data: { name, address, city, lat, lng },
                }),
                this.prisma.job.updateMany({
                    where: {
                        branchId,
                        status: { in: ['open', 'paused'] },
                    },
                    data: { status: 'pending' },
                }),
            ]);
            return { id: branchId };
        }
        else {
            const newBranch = await this.prisma.branch.create({
                data: {
                    companyId: company.id,
                    name,
                    address,
                    city,
                    lat,
                    lng,
                },
            });
            return { id: newBranch.id };
        }
    }
    async deleteBranch(userId, branchId) {
        const company = await this.prisma.company.findUnique({
            where: { ownerId: userId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Chưa có hồ sơ doanh nghiệp.');
        }
        const branch = await this.prisma.branch.findFirst({
            where: { id: branchId, companyId: company.id },
        });
        if (!branch) {
            throw new common_1.NotFoundException('Chi nhánh không tồn tại.');
        }
        const jobCount = await this.prisma.job.count({
            where: { branchId },
        });
        if (jobCount > 0) {
            throw new common_1.ConflictException('Chi nhánh đã gắn với tin tuyển dụng, không thể xóa.');
        }
        await this.prisma.branch.delete({
            where: { id: branchId },
        });
        return { ok: true };
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map