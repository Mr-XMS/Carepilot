import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, ShiftStatus, ShiftType, AuditAction } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { CreateRecurringShiftDto } from './dto/create-recurring-shift.dto';
import { CancelShiftDto } from './dto/cancel-shift.dto';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { QueryShiftsDto } from './dto/query-shifts.dto';
import { QueryExceptionsDto } from './dto/query-exceptions.dto';

@Injectable()
export class ShiftsService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async create(organisationId: string, dto: CreateShiftDto) {
    await this.validateShiftReferences(organisationId, dto);

    const scheduledStart = new Date(dto.scheduledStart);
    const scheduledEnd = new Date(dto.scheduledEnd);

    if (scheduledEnd <= scheduledStart) {
      throw new BadRequestException('Shift end time must be after start time');
    }

    const conflicts = await this.detectConflicts(
      organisationId,
      dto.userId,
      scheduledStart,
      scheduledEnd,
    );

    if (conflicts.length > 0) {
      throw new ConflictException({
        message: 'Shift conflicts with existing scheduled shifts',
        conflicts: conflicts.map((c) => ({
          id: c.id,
          scheduledStart: c.scheduledStart,
          scheduledEnd: c.scheduledEnd,
        })),
      });
    }

    return this.prisma.shift.create({
      data: {
        organisationId,
        participantId: dto.participantId,
        userId: dto.userId,
        serviceAgreementItemId: dto.serviceAgreementItemId,
        scheduledStart,
        scheduledEnd,
        shiftType: dto.shiftType || ShiftType.STANDARD,
        breakMinutes: dto.breakMinutes || 0,
        notes: dto.notes,
      },
      include: {
        participant: { select: { firstName: true, lastName: true, ndisNumber: true } },
        user: { select: { firstName: true, lastName: true } },
        serviceAgreementItem: {
          select: { supportItemNumber: true, supportItemName: true, unitPrice: true },
        },
      },
    });
  }

  async createRecurring(organisationId: string, dto: CreateRecurringShiftDto) {
    await this.validateShiftReferences(organisationId, {
      participantId: dto.participantId,
      userId: dto.userId,
      serviceAgreementItemId: dto.serviceAgreementItemId,
    });

    const recurringPatternId = uuidv4();
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const daysOfWeek = dto.daysOfWeek;

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const [startHour, startMin] = dto.startTime.split(':').map(Number);
    const [endHour, endMin] = dto.endTime.split(':').map(Number);

    const shiftsToCreate: Prisma.ShiftCreateManyInput[] = [];
    const conflictsFound: { date: Date; reason: string }[] = [];

    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      if (daysOfWeek.includes(cursor.getDay())) {
        const shiftStart = new Date(cursor);
        shiftStart.setHours(startHour, startMin, 0, 0);

        const shiftEnd = new Date(cursor);
        shiftEnd.setHours(endHour, endMin, 0, 0);

        if (endHour < startHour) {
          shiftEnd.setDate(shiftEnd.getDate() + 1);
        }

        const conflicts = await this.detectConflicts(
          organisationId,
          dto.userId,
          shiftStart,
          shiftEnd,
        );

        if (conflicts.length > 0) {
          conflictsFound.push({
            date: new Date(shiftStart),
            reason: `Conflicts with ${conflicts.length} existing shift(s)`,
          });
        } else {
          shiftsToCreate.push({
            organisationId,
            participantId: dto.participantId,
            userId: dto.userId,
            serviceAgreementItemId: dto.serviceAgreementItemId,
            scheduledStart: shiftStart,
            scheduledEnd: shiftEnd,
            shiftType: dto.shiftType || ShiftType.STANDARD,
            breakMinutes: dto.breakMinutes || 0,
            isRecurring: true,
            recurringPatternId,
            notes: dto.notes,
          });
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (shiftsToCreate.length === 0) {
      throw new BadRequestException(
        'No shifts could be created — all dates conflicted or no matching weekdays in range',
      );
    }

    await this.prisma.shift.createMany({ data: shiftsToCreate });

    return {
      recurringPatternId,
      shiftsCreated: shiftsToCreate.length,
      conflictsSkipped: conflictsFound.length,
      conflicts: conflictsFound,
    };
  }

  async findAll(organisationId: string, query: QueryShiftsDto) {
    const {
      participantId,
      userId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = query;

    const where: Prisma.ShiftWhereInput = {
      organisationId,
      ...(participantId && { participantId }),
      ...(userId && { userId }),
      ...(status && { status }),
      ...(startDate && endDate && {
        scheduledStart: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [shifts, total] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        include: {
          participant: { select: { id: true, firstName: true, lastName: true, ndisNumber: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          serviceAgreementItem: {
            select: { supportItemNumber: true, supportItemName: true, unitPrice: true },
          },
        },
        orderBy: { scheduledStart: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.shift.count({ where }),
    ]);

    return {
      data: shifts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findCalendarView(
    organisationId: string,
    startDate: string,
    endDate: string,
    userId?: string,
  ) {
    return this.prisma.shift.findMany({
      where: {
        organisationId,
        ...(userId && { userId }),
        status: { notIn: [ShiftStatus.CANCELLED, ShiftStatus.NO_SHOW] },
        scheduledStart: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        participant: { select: { id: true, firstName: true, lastName: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        serviceAgreementItem: { select: { supportItemName: true } },
      },
      orderBy: { scheduledStart: 'asc' },
    });
  }

  async findExceptions(organisationId: string, query: QueryExceptionsDto) {
    const {
      participantId,
      userId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = query;

    const where: Prisma.ShiftWhereInput = {
      organisationId,
      status: status
        ? status
        : { in: [ShiftStatus.CANCELLED, ShiftStatus.NO_SHOW] },
      ...(participantId && { participantId }),
      ...(userId && { userId }),
      ...(startDate && endDate && {
        scheduledStart: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    const [shifts, total] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        include: {
          participant: { select: { id: true, firstName: true, lastName: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          cancelledByUser: { select: { id: true, firstName: true, lastName: true } },
          noShowMarkedByUser: { select: { id: true, firstName: true, lastName: true } },
          serviceAgreementItem: { select: { supportItemName: true } },
        },
        orderBy: { scheduledStart: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.shift.count({ where }),
    ]);

    return {
      data: shifts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(organisationId: string, id: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { id, organisationId },
      include: {
        participant: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        serviceAgreementItem: {
          include: {
            serviceAgreement: { select: { id: true, status: true } },
          },
        },
        cancelledByUser: { select: { id: true, firstName: true, lastName: true } },
        noShowMarkedByUser: { select: { id: true, firstName: true, lastName: true } },
        shiftNotes: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    return shift;
  }

  async update(organisationId: string, id: string, dto: UpdateShiftDto) {
    const existing = await this.findOne(organisationId, id);

    if (existing.status === ShiftStatus.COMPLETED) {
      throw new BadRequestException('Cannot modify a completed shift');
    }

    const updateData: Prisma.ShiftUpdateInput = {};

    if (dto.scheduledStart) updateData.scheduledStart = new Date(dto.scheduledStart);
    if (dto.scheduledEnd) updateData.scheduledEnd = new Date(dto.scheduledEnd);
    if (dto.shiftType) updateData.shiftType = dto.shiftType;
    if (dto.breakMinutes !== undefined) updateData.breakMinutes = dto.breakMinutes;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.status) updateData.status = dto.status;

    if (dto.scheduledStart || dto.scheduledEnd) {
      const newStart = dto.scheduledStart ? new Date(dto.scheduledStart) : existing.scheduledStart;
      const newEnd = dto.scheduledEnd ? new Date(dto.scheduledEnd) : existing.scheduledEnd;

      if (newEnd <= newStart) {
        throw new BadRequestException('Shift end time must be after start time');
      }

      const conflicts = await this.detectConflicts(
        organisationId,
        existing.userId,
        newStart,
        newEnd,
        id,
      );

      if (conflicts.length > 0) {
        throw new ConflictException({
          message: 'Updated shift conflicts with existing shifts',
          conflicts: conflicts.map((c) => ({ id: c.id, scheduledStart: c.scheduledStart })),
        });
      }
    }

    return this.prisma.shift.update({
      where: { id },
      data: updateData,
      include: {
        participant: { select: { firstName: true, lastName: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async cancel(
    organisationId: string,
    id: string,
    cancelledByUserId: string,
    dto: CancelShiftDto,
  ) {
    const shift = await this.findOne(organisationId, id);

    if (shift.status === ShiftStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed shift');
    }

    if (shift.status === ShiftStatus.CANCELLED) {
      throw new BadRequestException('Shift is already cancelled');
    }

    const updated = await this.prisma.shift.update({
      where: { id },
      data: {
        status: ShiftStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledByUserId,
        cancellationReason: dto.reason,
      },
    });

    await this.auditLog.log({
      organisationId,
      userId: cancelledByUserId,
      entityType: 'Shift',
      entityId: id,
      action: AuditAction.CANCEL_SHIFT,
      changes: {
        previousStatus: shift.status,
        reason: dto.reason,
        participantId: shift.participantId,
        workerId: shift.userId,
        scheduledStart: shift.scheduledStart,
      },
    });

    return updated;
  }

  async cancelRecurringSeries(organisationId: string, recurringPatternId: string) {
    const result = await this.prisma.shift.updateMany({
      where: {
        organisationId,
        recurringPatternId,
        status: { in: [ShiftStatus.SCHEDULED] },
      },
      data: { status: ShiftStatus.CANCELLED },
    });

    return { cancelled: result.count };
  }

  async clockIn(organisationId: string, id: string, userId: string, dto: ClockInDto) {
    const shift = await this.findOne(organisationId, id);

    if (shift.userId !== userId) {
      throw new BadRequestException('You can only clock in to your own shifts');
    }

    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot clock in to a shift in status ${shift.status}`,
      );
    }

    return this.prisma.shift.update({
      where: { id },
      data: {
        status: ShiftStatus.IN_PROGRESS,
        actualStart: new Date(),
        clockInLat: dto.latitude,
        clockInLng: dto.longitude,
      },
    });
  }

  async clockOut(organisationId: string, id: string, userId: string, dto: ClockOutDto) {
    const shift = await this.findOne(organisationId, id);

    if (shift.userId !== userId) {
      throw new BadRequestException('You can only clock out of your own shifts');
    }

    if (shift.status !== ShiftStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot clock out of a shift in status ${shift.status}`,
      );
    }

    const actualEnd = new Date();
    const actualStart = shift.actualStart!;
    const totalMinutes = (actualEnd.getTime() - actualStart.getTime()) / 60000;
    const billableMinutes = totalMinutes - (shift.breakMinutes || 0);
    const billableHours = Math.max(0, billableMinutes / 60);

    return this.prisma.$transaction(async (tx) => {
      const updatedShift = await tx.shift.update({
        where: { id },
        data: {
          status: ShiftStatus.COMPLETED,
          actualEnd,
          billableHours,
          clockOutLat: dto.latitude,
          clockOutLng: dto.longitude,
        },
        include: { serviceAgreementItem: true },
      });

      const item = updatedShift.serviceAgreementItem;
      const additionalDelivered = billableHours;
      const additionalBudget = billableHours * Number(item.unitPrice);

      await tx.serviceAgreementItem.update({
        where: { id: item.id },
        data: {
          deliveredQty: { increment: additionalDelivered },
          deliveredBudget: { increment: additionalBudget },
        },
      });

      return updatedShift;
    });
  }

  async markNoShow(
    organisationId: string,
    id: string,
    markedByUserId: string,
  ) {
    const shift = await this.findOne(organisationId, id);

    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException('Can only mark scheduled shifts as no-show');
    }

    const updated = await this.prisma.shift.update({
      where: { id },
      data: {
        status: ShiftStatus.NO_SHOW,
        noShowMarkedAt: new Date(),
        noShowMarkedByUserId: markedByUserId,
      },
    });

    await this.auditLog.log({
      organisationId,
      userId: markedByUserId,
      entityType: 'Shift',
      entityId: id,
      action: AuditAction.NO_SHOW,
      changes: {
        participantId: shift.participantId,
        workerId: shift.userId,
        scheduledStart: shift.scheduledStart,
      },
    });

    return updated;
  }

  private async validateShiftReferences(
    organisationId: string,
    dto: { participantId: string; userId: string; serviceAgreementItemId: string },
  ) {
    const [participant, user, sai] = await Promise.all([
      this.prisma.participant.findFirst({
        where: { id: dto.participantId, organisationId, deletedAt: null },
      }),
      this.prisma.user.findFirst({
        where: { id: dto.userId, organisationId, deletedAt: null, isActive: true },
      }),
      this.prisma.serviceAgreementItem.findFirst({
        where: {
          id: dto.serviceAgreementItemId,
          serviceAgreement: { organisationId, status: 'ACTIVE' },
        },
        include: { serviceAgreement: true },
      }),
    ]);

    if (!participant) throw new NotFoundException('Participant not found');
    if (!user) throw new NotFoundException('Support worker not found or inactive');
    if (!sai) {
      throw new NotFoundException(
        'Service agreement item not found or parent agreement is not active',
      );
    }

    if (sai.serviceAgreement.participantId !== dto.participantId) {
      throw new BadRequestException(
        'Service agreement item does not belong to the specified participant',
      );
    }
  }

  private async detectConflicts(
    organisationId: string,
    userId: string,
    start: Date,
    end: Date,
    excludeShiftId?: string,
  ) {
    return this.prisma.shift.findMany({
      where: {
        organisationId,
        userId,
        status: { in: [ShiftStatus.SCHEDULED, ShiftStatus.IN_PROGRESS] },
        ...(excludeShiftId && { id: { not: excludeShiftId } }),
        OR: [
          { AND: [{ scheduledStart: { lte: start } }, { scheduledEnd: { gt: start } }] },
          { AND: [{ scheduledStart: { lt: end } }, { scheduledEnd: { gte: end } }] },
          { AND: [{ scheduledStart: { gte: start } }, { scheduledEnd: { lte: end } }] },
        ],
      },
      select: { id: true, scheduledStart: true, scheduledEnd: true },
    });
  }
}
