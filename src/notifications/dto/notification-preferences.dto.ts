import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  enableEmailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  enableSmsNotifications?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'emailDigestTime must be in HH:MM format (24-hour)',
  })
  emailDigestTime?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class NotificationPreferencesResponseDto {
  id: string;
  userId: string;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  emailDigestTime: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}
