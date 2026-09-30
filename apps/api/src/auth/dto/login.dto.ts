import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email: string;

  @IsString({ message: 'Vui lòng nhập mật khẩu.' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  password: string;
}
