import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;
}
