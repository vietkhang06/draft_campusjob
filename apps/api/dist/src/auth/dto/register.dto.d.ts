export declare enum AllowedRegisterRole {
    STUDENT = "student",
    EMPLOYER = "employer"
}
export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    role: AllowedRegisterRole;
}
