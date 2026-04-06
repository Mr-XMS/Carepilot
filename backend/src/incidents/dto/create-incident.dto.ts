import {
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentCategory, IncidentSeverity } from '@prisma/client';

export class CreateIncidentDto {
  @ApiPropertyOptional({ description: 'Optional — for incidents involving a specific participant' })
  @IsOptional()
  @IsUUID()
  participantId?: string;

  @ApiProperty({ example: '2026-04-07T14:30:00+10:00' })
  @IsDateString()
  incidentDate: string;

  @ApiProperty({ enum: IncidentCategory, example: IncidentCategory.INJURY })
  @IsEnum(IncidentCategory)
  category: IncidentCategory;

  @ApiProperty({ enum: IncidentSeverity, example: IncidentSeverity.MEDIUM })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiProperty({
    example: 'Participant slipped while transferring from wheelchair to bed. Minor bruise to left elbow.',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({
    example: 'First aid applied. Notified family. Cold compress provided. Continued monitoring.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  immediateActions?: string;
}
