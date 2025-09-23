import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

// Custom validator decorator
function IsEmailOrPhoneRequired(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEmailOrPhoneRequired',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          return !!(obj.email || obj.phoneNumber);
        },
        defaultMessage() {
          return 'Either email or phoneNumber is required';
        },
      },
    });
  };
}

export class CreateAdminUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  // at least one of email or phoneNumber
  @IsEmailOrPhoneRequired()
  get _emailOrPhoneRequired(): string {
    return this.email || this.phoneNumber || '';
  }
}
