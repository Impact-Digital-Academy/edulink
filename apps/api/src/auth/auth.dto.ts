import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RequestCodeDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class VerifyCodeDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code!: string;

  // Required the first time an address signs in (creating the account).
  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  deviceName?: string;
}

export class RefreshDto {
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  refreshToken!: string;
}
