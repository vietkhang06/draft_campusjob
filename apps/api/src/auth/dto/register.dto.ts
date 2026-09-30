import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum AllowedRegisterRole {
  STUDENT = 'student',
  EMPLOYER = 'employer',
}

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi.' })
  @Length(10, 100, { message: 'Mật khẩu phải có tối thiểu 10 ký tự.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{10,}$/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.',
  })
  password: string;

  @IsString({ message: 'Họ tên không được để trống.' })
  @IsNotEmpty({ message: 'Vui lòng nhập họ và tên.' })
  @Length(2, 120, { message: 'Họ tên từ 2 đến 120 ký tự.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsEnum(AllowedRegisterRole, {
    message: 'Vai trò đăng ký chỉ được phép là sinh viên (student) hoặc nhà tuyển dụng (employer).',
  })
  role: AllowedRegisterRole;
}
