import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ShiftStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { SchadsRuleEngine, ShiftLike, SchadsViolation, PayEstimate } from './schads-rule-engine';

const AU_PUBLIC_HOLIDAYS_2026: Date[] = [
  new Date('2026-01-01'),
  new Date('2026-01-26'),
  new Date('2026-04-03'),
  new Date('2026-04-04'),
  new Date('2026-04-05'),
  new Date('2026-04-06'),
  new Date('2026-04-25'),
  new Date('2026-05-04'),
  new Date('2026-06-08'),
  new Date('2026-08-12'),
  new Date('2026-10-05'),
  new Date('2026-12-25'),
  new Date('2026-12-26'),
  new Date('2026-12-28'),
];

@Injectable()
export class SchadsService {
  constructor(
    private prisma: PrismaService,
    private ruleEngine: SchadsRuleEngine,
  ) {}

  async validateRosterByDateRange(
    organisationId: string,
    startDate: string,
    endDate: string,
    userId?: string,
  ): Promise<{ violations: SchadsViolation[]; shiftCount: number; userCount: number }> {
    const shifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        ...(userId && { userId }),
        scheduledStart: { gte: new Date(startDate) },
        scheduledEnd: { lte: new Date(endDate) },
        status: { in: [ShiftStatus.SCHEDULED, ShiftStatus.IN_PROGRESS] },
      },
      select: {
        id: true,
        userId: true,
        scheduledStart: true,
        scheduledEnd: true,
        breakMinutes: true,
        shiftType: true,
      },
      orderBy: { scheduledStart: 'asc' },
    });

    const shiftLikes: ShiftLike[] = shifts.map((s) => ({
      id: s.id,
      userId: s.userId,
      scheduledStart: s.scheduledStart,
      scheduledEnd: s.scheduledEnd,
      breakMinutes: s.breakMinutes,
      shiftType: s.shiftType,
    }));

    const violations = this.ruleEngine.validateRoster(shiftLikes, AU_PUBLIC_HOLIDAYS_2026);
    const uniqueUsers = new Set(shifts.map((s) => s.userId));

    return {
      violations,
      shiftCount: shifts.length,
      userCount: uniqueUsers.size,
    };
  }

  async validateSingleShift(organisationId: string, shiftId: string): Promise<SchadsViolation[]> {
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, organisationId },
      select: {
        id: true,
        userId: true,
        scheduledStart: true,
        scheduledEnd: true,
        breakMinutes: true,
        shiftType: true,
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const sevenDaysBefore = new Date(shift.scheduledStart);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
    const sevenDaysAfter = new Date(shift.scheduledEnd);
    sevenDaysAfter.setDate(sevenDaysAfter.getDate() + 7);

    const contextShifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        userId: shift.userId,
        scheduledStart: { gte: sevenDaysBefore, lte: sevenDaysAfter },
        status: { in: [ShiftStatus.SCHEDULED, ShiftStatus.IN_PROGRESS] },
      },
      select: {
        id: true,
        userId: true,
        scheduledStart: true,
        scheduledEnd: true,
        breakMinutes: true,
        shiftType: true,
      },
      orderBy: { scheduledStart: 'asc' },
    });

    const violations = this.ruleEngine.validateRoster(contextShifts, AU_PUBLIC_HOLIDAYS_2026);
    return violations.filter((v) => v.shiftId === shiftId);
  }

  async estimatePayForRoster(
    organisationId: string,
    startDate: string,
    endDate: string,
    userId: string,
  ): Promise<PayEstimate & { userId: string; userName: string }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organisationId },
      select: { id: true, firstName: true, lastName: true, hourlyRate: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.hourlyRate) {
      throw new BadRequestException(
        'Cannot estimate pay: no hourly rate configured for this worker',
      );
    }

    const shifts = await this.prisma.shift.findMany({
      where: {
        organisationId,
        userId,
        scheduledStart: { gte: new Date(startDate) },
        scheduledEnd: { lte: new Date(endDate) },
        status: { in: [ShiftStatus.SCHEDULED, ShiftStatus.IN_PROGRESS, ShiftStatus.COMPLETED] },
      },
      select: {
        id: true,
        userId: true,
        scheduledStart: true,
        scheduledEnd: true,
        breakMinutes: true,
        shiftType: true,
      },
    });

    const estimate = this.ruleEngine.estimatePayCost(
      shifts,
      Number(user.hourlyRate),
      AU_PUBLIC_HOLIDAYS_2026,
    );

    return {
      ...estimate,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
    };
  }

  async estimatePayForOrgRoster(
    organisationId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    totalCost: number;
    totalHours: number;
    workerCount: number;
    byWorker: Array<{ userId: string; userName: string; hours: number; cost: number }>;
  }> {
    const users = await this.prisma.user.findMany({
      where: {
        organisationId,
        hourlyRate: { not: null },
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true, hourlyRate: true },
    });

    const byWorker: Array<{ userId: string; userName: string; hours: number; cost: number }> = [];
    let totalCost = 0;
    let totalHours = 0;

    for (const user of users) {
      const shifts = await this.prisma.shift.findMany({
        where: {
          organisationId,
          userId: user.id,
          scheduledStart: { gte: new Date(startDate) },
          scheduledEnd: { lte: new Date(endDate) },
          status: { in: [ShiftStatus.SCHEDULED, ShiftStatus.IN_PROGRESS, ShiftStatus.COMPLETED] },
        },
        select: {
          id: true,
          userId: true,
          scheduledStart: true,
          scheduledEnd: true,
          breakMinutes: true,
          shiftType: true,
        },
      });

      if (shifts.length === 0) continue;

      const estimate = this.ruleEngine.estimatePayCost(
        shifts,
        Number(user.hourlyRate),
        AU_PUBLIC_HOLIDAYS_2026,
      );

      byWorker.push({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        hours: estimate.totalHours,
        cost: estimate.totalCost,
      });

      totalCost += estimate.totalCost;
      totalHours += estimate.totalHours;
    }

    return {
      totalCost,
      totalHours,
      workerCount: byWorker.length,
      byWorker: byWorker.sort((a, b) => b.cost - a.cost),
    };
  }
}
