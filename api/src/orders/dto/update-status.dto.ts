import { IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsIn(['making', 'served', 'fulfilled'])
  status!: 'making' | 'served' | 'fulfilled';
}
