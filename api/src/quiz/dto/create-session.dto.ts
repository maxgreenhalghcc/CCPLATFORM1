import { IsString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  bar_slug!: string;
}
