import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Mã đặt lại mật khẩu phải là chuỗi.' })
  @IsNotEmpty({ message: 'Vui lòng cung cấp mã đặt lại mật khẩu.' })
  token: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi.' })
  @Length(10, 100, { message: 'Mật khẩu phải có tối thiểu 10 ký tự.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{10,}$/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.',
  })
  password: string;
}
