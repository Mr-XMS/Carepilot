import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NoteType } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateShiftNoteDto } from './dto/create-shift-note.dto';
import { UpdateShiftNoteDto } from './dto/update-shift-note.dto';

@Injectable()
export class ShiftNotesService {
  constructor(private prisma: PrismaService) {}

  async create(organisationId: string, shiftId: string, userId: string, dto: CreateShiftNoteDto) {
    // Verify shift exists and belongs to organisation
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, organisationId },
    });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    return this.prisma.shiftNote.create({
      data: {
        shiftId,
        userId,
        content: dto.content,
        noteType: dto.noteType || NoteType.PROGRESS,
        goalIds: dto.goalIds || [],
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findByShift(organisationId: string, shiftId: string) {
    // Verify shift belongs to organisation
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, organisationId },
    });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    return this.prisma.shiftNote.findMany({
      where: { shiftId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(organisationId: string, noteId: string, userId: string, dto: UpdateShiftNoteDto) {
    const note = await this.prisma.shiftNote.findFirst({
      where: { id: noteId },
      include: { shift: { select: { organisationId: true } } },
    });

    if (!note || note.shift.organisationId !== organisationId) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You can only edit your own notes');
    }

    return this.prisma.shiftNote.update({
      where: { id: noteId },
      data: { content: dto.content },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async remove(organisationId: string, noteId: string, userId: string) {
    const note = await this.prisma.shiftNote.findFirst({
      where: { id: noteId },
      include: { shift: { select: { organisationId: true } } },
    });

    if (!note || note.shift.organisationId !== organisationId) {
      throw new NotFoundException('Note not found');
    }

    if (note.userId !== userId) {
      throw new ForbiddenException('You can only delete your own notes');
    }

    await this.prisma.shiftNote.delete({ where: { id: noteId } });
    return { deleted: true };
  }
}
