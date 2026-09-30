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
exports.RegisterDto = exports.AllowedRegisterRole = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var AllowedRegisterRole;
(function (AllowedRegisterRole) {
    AllowedRegisterRole["STUDENT"] = "student";
    AllowedRegisterRole["EMPLOYER"] = "employer";
})(AllowedRegisterRole || (exports.AllowedRegisterRole = AllowedRegisterRole = {}));
class RegisterDto {
    email;
    password;
    name;
    role;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Email không hợp lệ.' }),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Mật khẩu phải là chuỗi.' }),
    (0, class_validator_1.Length)(10, 100, { message: 'Mật khẩu phải có tối thiểu 10 ký tự.' }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{10,}$/, {
        message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Họ tên không được để trống.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng nhập họ và tên.' }),
    (0, class_validator_1.Length)(2, 120, { message: 'Họ tên từ 2 đến 120 ký tự.' }),
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(AllowedRegisterRole, {
        message: 'Vai trò đăng ký chỉ được phép là sinh viên (student) hoặc nhà tuyển dụng (employer).',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "role", void 0);
//# sourceMappingURL=register.dto.js.map