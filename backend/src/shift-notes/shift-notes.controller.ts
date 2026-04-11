import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShiftNotesService } from './shift-notes.service';
import { CreateShiftNoteDto } from './dto/create-shift-note.dto';
import { UpdateShiftNoteDto } from './dto/update-shift-note.dto';
import { OrgId, CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('ShiftNotes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('shifts/:shiftId/notes')
export class ShiftNotesController {
  constructor(private service: ShiftNotesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a note to a shift' })
  create(
    @OrgId() orgId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateShiftNoteDto,
  ) {
    return this.service.create(orgId, shiftId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notes for a shift' })
  findAll(
    @OrgId() orgId: string,
    @Param('shiftId', ParseUUIDPipe) shiftId: string,
  ) {
    return this.service.findByShift(orgId, shiftId);
  }

  @Patch(':noteId')
  @ApiOperation({ summary: 'Update a shift note (own notes only)' })
  update(
    @OrgId() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: UpdateShiftNoteDto,
  ) {
    return this.service.update(orgId, noteId, userId, dto);
  }

  @Delete(':noteId')
  @ApiOperation({ summary: 'Delete a shift note (own notes only)' })
  remove(
    @OrgId() orgId: string,
    @CurrentUser('id') userId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
  ) {
    return this.service.remove(orgId, noteId, userId);
  }
}
