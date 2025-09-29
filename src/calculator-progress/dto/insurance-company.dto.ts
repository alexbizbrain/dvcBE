import { IsOptional, IsString } from 'class-validator';

export class InsuranceCompanyDto {
    @IsOptional()
    @IsString()
    insuranceCompanyId?: string;

    @IsOptional()
    @IsString()
    companyName?: string;
}
