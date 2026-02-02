import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['making', 'fulfilled'])
  status!: 'making' | 'fulfilled';
}
