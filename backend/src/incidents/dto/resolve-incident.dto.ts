import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveIncidentDto {
  @ApiProperty({
    example: 'Participant fully recovered. Manual handling refresher scheduled for all support workers servicing this participant.',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  outcomeNotes: string;
}
