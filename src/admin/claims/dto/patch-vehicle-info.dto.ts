import { IsObject } from 'class-validator';

export class PatchVehicleInfoDto {
  @IsObject()
  vehicleInfo!: Record<string, any>;
}
