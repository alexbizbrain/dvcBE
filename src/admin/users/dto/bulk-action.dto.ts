import { IsArray, IsString, IsIn } from 'class-validator';

export class BulkActionDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsString()
  @IsIn(['activate', 'deactivate', 'delete'])
  action: 'activate' | 'deactivate' | 'delete';
}
