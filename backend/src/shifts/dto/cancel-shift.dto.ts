import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelShiftDto {
  @ApiProperty({ example: 'Participant requested cancellation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
