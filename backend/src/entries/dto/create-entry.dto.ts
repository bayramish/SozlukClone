import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  topicId: number;
}
