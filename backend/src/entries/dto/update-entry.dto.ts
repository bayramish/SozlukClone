import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateEntryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;
}
