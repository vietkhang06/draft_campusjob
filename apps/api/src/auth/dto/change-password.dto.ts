import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Vui lòng nhập mật khẩu hiện tại.' })
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống.' })
  oldPassword: string;

  @IsString({ message: 'Mật khẩu mới phải là chuỗi.' })
  @Length(10, 100, { message: 'Mật khẩu mới phải có tối thiểu 10 ký tự.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{10,}$/, {
    message: 'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.',
  })
  newPassword: string;
}
