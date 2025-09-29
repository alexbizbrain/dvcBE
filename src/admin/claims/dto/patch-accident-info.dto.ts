import { IsObject } from 'class-validator';

export class PatchAccidentInfoDto {
  @IsObject()
  accidentInfo!: Record<string, any>;
}
