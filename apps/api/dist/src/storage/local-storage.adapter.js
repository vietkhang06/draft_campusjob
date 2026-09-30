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
var LocalStorageAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageAdapter = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
let LocalStorageAdapter = LocalStorageAdapter_1 = class LocalStorageAdapter {
    logger = new common_1.Logger(LocalStorageAdapter_1.name);
    storageRoot;
    constructor(customPath) {
        const rawPath = customPath || process.env.LOCAL_STORAGE_PATH || './var/uploads';
        this.storageRoot = path.isAbsolute(rawPath)
            ? path.normalize(rawPath)
            : path.resolve(process.cwd(), rawPath);
        this.ensureStorageRoot();
    }
    ensureStorageRoot() {
        try {
            if (!fs.existsSync(this.storageRoot)) {
                fs.mkdirSync(this.storageRoot, { recursive: true });
                this.logger.log(`Tạo thư mục lưu trữ cục bộ: ${this.storageRoot}`);
            }
        }
        catch (err) {
            this.logger.error(`Không thể tạo thư mục lưu trữ cục bộ: ${err.message}`);
        }
    }
    resolveSafePath(key) {
        if (!key || typeof key !== 'string') {
            throw new common_1.BadRequestException('Mã tệp lưu trữ không hợp lệ.');
        }
        if (key.includes('..') || path.isAbsolute(key) || key.includes('/') || key.includes('\\')) {
            throw new common_1.BadRequestException('Khóa lưu trữ không hợp lệ (phát hiện ký tự nguy hiểm).');
        }
        const resolved = path.resolve(this.storageRoot, key);
        if (!resolved.startsWith(this.storageRoot + path.sep) && resolved !== this.storageRoot) {
            throw new common_1.BadRequestException('Truy cập tệp nằm ngoài thư mục lưu trữ được cho phép.');
        }
        return resolved;
    }
    async put(input) {
        const filePath = this.resolveSafePath(input.key);
        const metaPath = `${filePath}.meta`;
        await fs.promises.writeFile(filePath, input.body);
        await fs.promises.writeFile(metaPath, JSON.stringify({
            contentType: input.contentType,
            size: input.body.length,
            createdAt: new Date().toISOString(),
        }), 'utf8');
    }
    async get(key) {
        const filePath = this.resolveSafePath(key);
        const metaPath = `${filePath}.meta`;
        try {
            await fs.promises.access(filePath, fs.constants.R_OK);
        }
        catch {
            throw new common_1.NotFoundException('Không tìm thấy tệp trong kho lưu trữ cục bộ.');
        }
        let contentType = 'application/octet-stream';
        let size;
        try {
            const metaContent = await fs.promises.readFile(metaPath, 'utf8');
            const meta = JSON.parse(metaContent);
            contentType = meta.contentType || contentType;
            size = meta.size;
        }
        catch {
            const stat = await fs.promises.stat(filePath);
            size = stat.size;
        }
        const stream = fs.createReadStream(filePath);
        return {
            body: stream,
            contentType,
            size,
        };
    }
    async delete(key) {
        const filePath = this.resolveSafePath(key);
        const metaPath = `${filePath}.meta`;
        try {
            await fs.promises.unlink(filePath);
        }
        catch (err) {
            if (err.code !== 'ENOENT') {
                this.logger.warn(`Lỗi khi xóa tệp ${filePath}: ${err.message}`);
            }
        }
        try {
            await fs.promises.unlink(metaPath);
        }
        catch {
        }
    }
    async exists(key) {
        try {
            const filePath = this.resolveSafePath(key);
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    }
    getStorageRoot() {
        return this.storageRoot;
    }
};
exports.LocalStorageAdapter = LocalStorageAdapter;
exports.LocalStorageAdapter = LocalStorageAdapter = LocalStorageAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String])
], LocalStorageAdapter);
//# sourceMappingURL=local-storage.adapter.js.map