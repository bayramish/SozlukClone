import { IsInt, IsIn } from 'class-validator';

export class CreateVoteDto {
  @IsInt()
  entryId: number;

  @IsInt()
  @IsIn([1, -1])
  value: number;
}
