import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['fulfilled'])
  status!: 'fulfilled';
}
