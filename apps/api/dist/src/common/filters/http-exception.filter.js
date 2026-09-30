"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_SERVER_ERROR';
        let message = 'Đã xảy ra lỗi trên hệ thống. Vui lòng thử lại sau.';
        let details = undefined;
        if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = res;
                code = this.codeFromStatus(statusCode);
            }
            else if (typeof res === 'object' && res !== null) {
                const resObj = res;
                message = Array.isArray(resObj.message)
                    ? resObj.message.join('; ')
                    : resObj.message || message;
                code = resObj.code || resObj.error || this.codeFromStatus(statusCode);
                details = resObj.details || (Array.isArray(resObj.message) ? resObj.message : undefined);
            }
        }
        else if (exception instanceof Error) {
            this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
            if (/Unique constraint/i.test(exception.message)) {
                statusCode = common_1.HttpStatus.CONFLICT;
                code = 'CONFLICT';
                message = 'Dữ liệu đã tồn tại hoặc thao tác đã được xử lý.';
            }
        }
        response.status(statusCode).json({
            statusCode,
            code,
            message,
            ...(details !== undefined ? { details } : {}),
        });
    }
    codeFromStatus(status) {
        switch (status) {
            case 400:
                return 'BAD_REQUEST';
            case 401:
                return 'UNAUTHORIZED';
            case 403:
                return 'FORBIDDEN';
            case 404:
                return 'NOT_FOUND';
            case 405:
                return 'METHOD_NOT_ALLOWED';
            case 409:
                return 'CONFLICT';
            case 413:
                return 'PAYLOAD_TOO_LARGE';
            case 428:
                return 'PRECONDITION_REQUIRED';
            case 429:
                return 'TOO_MANY_REQUESTS';
            case 503:
                return 'SERVICE_UNAVAILABLE';
            default:
                return 'ERROR';
        }
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map