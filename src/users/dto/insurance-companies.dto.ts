import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min, IsEnum } from "class-validator";
import { InsuranceType } from "@prisma/client";

export class GetInsuranceCompaniesDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(InsuranceType)
    type?: InsuranceType;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 50;
}