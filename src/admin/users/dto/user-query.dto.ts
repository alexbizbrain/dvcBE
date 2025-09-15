import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BooleanTransform } from 'src/utils/transform.util';

export class UserQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  //   @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @BooleanTransform()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @BooleanTransform()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  @BooleanTransform()
  isPhoneVerified?: boolean;

  @IsOptional()
  //   @IsBoolean()
  //   @BooleanTransform()
  @Transform(({ value }) => value === 'true')
  isBusinessUser?: boolean;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;
}
