import { IsString, IsNotEmpty, MaxLength, IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteType } from '@prisma/client';

export class CreateShiftNoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  @ApiPropertyOptional({ enum: NoteType, default: NoteType.PROGRESS })
  @IsOptional()
  @IsEnum(NoteType)
  noteType?: NoteType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  goalIds?: string[];
}
