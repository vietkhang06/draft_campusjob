import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString({ message: 'Mã xác minh phải là chuỗi.' })
  @IsNotEmpty({ message: 'Vui lòng cung cấp mã xác minh.' })
  token: string;

  @IsOptional()
  @IsString({ message: 'Email phải là chuỗi.' })
  email?: string;
}
