import { Injectable } from '@nestjs/common';

export enum SchadsViolationCode {
  MIN_ENGAGEMENT = 'MIN_ENGAGEMENT',
  BROKEN_SHIFT = 'BROKEN_SHIFT',
  INSUFFICIENT_REST = 'INSUFFICIENT_REST',
  EXCEEDS_DAILY_HOURS = 'EXCEEDS_DAILY_HOURS',
  EXCEEDS_WEEKLY_HOURS = 'EXCEEDS_WEEKLY_HOURS',
  CONSECUTIVE_DAYS = 'CONSECUTIVE_DAYS',
  MISSING_BREAK = 'MISSING_BREAK',
}

export enum SchadsTimeBand {
  WEEKDAY_DAY = 'WEEKDAY_DAY',
  WEEKDAY_EVENING = 'WEEKDAY_EVENING',
  WEEKDAY_NIGHT = 'WEEKDAY_NIGHT',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
  PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY',
}

export interface SchadsViolation {
  code: SchadsViolationCode;
  severity: 'WARNING' | 'ERROR';
  shiftId?: string;
  message: string;
  details?: Record<string, any>;
}

export interface ShiftLike {
  id: string;
  userId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  breakMinutes: number;
  shiftType: string;
}

export interface PayEstimate {
  totalHours: number;
  baseHours: number;
  overtimeHours: number;
  byBand: Record<SchadsTimeBand, { hours: number; rate: number; cost: number }>;
  totalCost: number;
  baseRate: number;
}

const SCHADS_LOADINGS: Record<SchadsTimeBand, number> = {
  [SchadsTimeBand.WEEKDAY_DAY]: 1.0,
  [SchadsTimeBand.WEEKDAY_EVENING]: 1.125,
  [SchadsTimeBand.WEEKDAY_NIGHT]: 1.15,
  [SchadsTimeBand.SATURDAY]: 1.5,
  [SchadsTimeBand.SUNDAY]: 2.0,
  [SchadsTimeBand.PUBLIC_HOLIDAY]: 2.5,
};

const SCHADS_LIMITS = {
  MIN_ENGAGEMENT_HOURS: 2,
  MIN_REST_BETWEEN_SHIFTS_HOURS: 10,
  MAX_DAILY_HOURS: 12,
  MAX_WEEKLY_HOURS: 38,
  MAX_CONSECUTIVE_DAYS: 6,
  BROKEN_SHIFT_GAP_MINUTES: 60,
  BREAK_REQUIRED_AFTER_HOURS: 5,
};

@Injectable()
export class SchadsRuleEngine {
  validateRoster(shifts: ShiftLike[], publicHolidays: Date[] = []): SchadsViolation[] {
    const violations: SchadsViolation[] = [];

    const sortedShifts = [...shifts].sort(
      (a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime(),
    );

    for (const shift of sortedShifts) {
      violations.push(...this.checkSingleShift(shift));
    }

    const shiftsByUser = this.groupBy(sortedShifts, (s) => s.userId);

    for (const [userId, userShifts] of shiftsByUser) {
      violations.push(...this.checkRestPeriods(userShifts));
      violations.push(...this.checkBrokenShifts(userShifts));
      violations.push(...this.checkConsecutiveDays(userShifts));
      violations.push(...this.checkWeeklyHours(userShifts));
      violations.push(...this.checkDailyHours(userShifts));
    }

    return violations;
  }

  private checkSingleShift(shift: ShiftLike): SchadsViolation[] {
    const violations: SchadsViolation[] = [];
    const durationHours = this.shiftDurationHours(shift);

    if (durationHours < SCHADS_LIMITS.MIN_ENGAGEMENT_HOURS) {
      violations.push({
        code: SchadsViolationCode.MIN_ENGAGEMENT,
        severity: 'ERROR',
        shiftId: shift.id,
        message: `Shift duration ${durationHours.toFixed(2)}h is below SCHADS minimum engagement of ${SCHADS_LIMITS.MIN_ENGAGEMENT_HOURS}h`,
        details: { durationHours, minimum: SCHADS_LIMITS.MIN_ENGAGEMENT_HOURS },
      });
    }

    if (
      durationHours > SCHADS_LIMITS.BREAK_REQUIRED_AFTER_HOURS &&
      shift.breakMinutes < 30
    ) {
      violations.push({
        code: SchadsViolationCode.MISSING_BREAK,
        severity: 'WARNING',
        shiftId: shift.id,
        message: `Shifts over ${SCHADS_LIMITS.BREAK_REQUIRED_AFTER_HOURS}h require a minimum 30-minute break`,
        details: { durationHours, breakMinutes: shift.breakMinutes },
      });
    }

    return violations;
  }

  private checkRestPeriods(shifts: ShiftLike[]): SchadsViolation[] {
    const violations: SchadsViolation[] = [];

    for (let i = 1; i < shifts.length; i++) {
      const prev = shifts[i - 1];
      const curr = shifts[i];
      const gapHours =
        (curr.scheduledStart.getTime() - prev.scheduledEnd.getTime()) / 3600000;

      if (gapHours > 0 && gapHours < SCHADS_LIMITS.MIN_REST_BETWEEN_SHIFTS_HOURS) {
        violations.push({
          code: SchadsViolationCode.INSUFFICIENT_REST,
          severity: 'ERROR',
          shiftId: curr.id,
          message: `Only ${gapHours.toFixed(1)}h rest after previous shift. SCHADS requires ${SCHADS_LIMITS.MIN_REST_BETWEEN_SHIFTS_HOURS}h minimum.`,
          details: {
            previousShiftId: prev.id,
            gapHours,
            requiredHours: SCHADS_LIMITS.MIN_REST_BETWEEN_SHIFTS_HOURS,
          },
        });
      }
    }

    return violations;
  }

  private checkBrokenShifts(shifts: ShiftLike[]): SchadsViolation[] {
    const violations: SchadsViolation[] = [];

    const shiftsByDay = this.groupBy(shifts, (s) => this.dateKey(s.scheduledStart));

    for (const [day, dayShifts] of shiftsByDay) {
      if (dayShifts.length < 2) continue;

      const sorted = dayShifts.sort(
        (a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime(),
      );

      for (let i = 1; i < sorted.length; i++) {
        const gapMinutes =
          (sorted[i].scheduledStart.getTime() - sorted[i - 1].scheduledEnd.getTime()) / 60000;

        if (gapMinutes >= SCHADS_LIMITS.BROKEN_SHIFT_GAP_MINUTES) {
          violations.push({
            code: SchadsViolationCode.BROKEN_SHIFT,
            severity: 'WARNING',
            shiftId: sorted[i].id,
            message: `Broken shift detected — ${(gapMinutes / 60).toFixed(1)}h gap. SCHADS broken shift allowance applies.`,
            details: {
              previousShiftId: sorted[i - 1].id,
              gapMinutes,
              date: day,
            },
          });
        }
      }
    }

    return violations;
  }

  private checkConsecutiveDays(shifts: ShiftLike[]): SchadsViolation[] {
    const violations: SchadsViolation[] = [];

    const dayKeys = Array.from(new Set(shifts.map((s) => this.dateKey(s.scheduledStart)))).sort();

    let consecutive = 1;
    for (let i = 1; i < dayKeys.length; i++) {
      const prev = new Date(dayKeys[i - 1]);
      const curr = new Date(dayKeys[i]);
      const dayDiff = Math.round((curr.getTime() - prev.getTime()) / 86400000);

      if (dayDiff === 1) {
        consecutive++;
        if (consecutive > SCHADS_LIMITS.MAX_CONSECUTIVE_DAYS) {
          const offendingShift = shifts.find(
            (s) => this.dateKey(s.scheduledStart) === dayKeys[i],
          );
          violations.push({
            code: SchadsViolationCode.CONSECUTIVE_DAYS,
            severity: 'WARNING',
            shiftId: offendingShift?.id,
            message: `Worker scheduled ${consecutive} consecutive days. SCHADS maximum is ${SCHADS_LIMITS.MAX_CONSECUTIVE_DAYS}.`,
            details: { consecutiveDays: consecutive },
          });
        }
      } else {
        consecutive = 1;
      }
    }

    return violations;
  }

  private checkWeeklyHours(shifts: ShiftLike[]): SchadsViolation[] {
    const violations: SchadsViolation[] = [];
    const shiftsByWeek = this.groupBy(shifts, (s) => this.weekKey(s.scheduledStart));

    for (const [week, weekShifts] of shiftsByWeek) {
      const totalHours = weekShifts.reduce((sum, s) => sum + this.shiftDurationHours(s), 0);

      if (totalHours > SCHADS_LIMITS.MAX_WEEKLY_HOURS) {
        const lastShift = weekShifts[weekShifts.length - 1];
        violations.push({
          code: SchadsViolationCode.EXCEEDS_WEEKLY_HOURS,
          severity: 'WARNING',
          shiftId: lastShift.id,
          message: `Worker scheduled ${totalHours.toFixed(1)}h in week starting ${week}. Exceeds standard ${SCHADS_LIMITS.MAX_WEEKLY_HOURS}h. Overtime rates apply.`,
          details: { weekStart: week, totalHours, threshold: SCHADS_LIMITS.MAX_WEEKLY_HOURS },
        });
      }
    }

    return violations;
  }

  private checkDailyHours(shifts: ShiftLike[]): SchadsViolation[] {
    const violations: SchadsViolation[] = [];
    const shiftsByDay = this.groupBy(shifts, (s) => this.dateKey(s.scheduledStart));

    for (const [day, dayShifts] of shiftsByDay) {
      const totalHours = dayShifts.reduce((sum, s) => sum + this.shiftDurationHours(s), 0);

      if (totalHours > SCHADS_LIMITS.MAX_DAILY_HOURS) {
        const lastShift = dayShifts[dayShifts.length - 1];
        violations.push({
          code: SchadsViolationCode.EXCEEDS_DAILY_HOURS,
          severity: 'ERROR',
          shiftId: lastShift.id,
          message: `Worker scheduled ${totalHours.toFixed(1)}h on ${day}. Exceeds maximum ${SCHADS_LIMITS.MAX_DAILY_HOURS}h per day.`,
          details: { date: day, totalHours, threshold: SCHADS_LIMITS.MAX_DAILY_HOURS },
        });
      }
    }

    return violations;
  }

  estimatePayCost(
    shifts: ShiftLike[],
    baseHourlyRate: number,
    publicHolidays: Date[] = [],
  ): PayEstimate {
    const byBand: Record<SchadsTimeBand, { hours: number; rate: number; cost: number }> = {
      [SchadsTimeBand.WEEKDAY_DAY]: { hours: 0, rate: baseHourlyRate, cost: 0 },
      [SchadsTimeBand.WEEKDAY_EVENING]: {
        hours: 0,
        rate: baseHourlyRate * SCHADS_LOADINGS[SchadsTimeBand.WEEKDAY_EVENING],
        cost: 0,
      },
      [SchadsTimeBand.WEEKDAY_NIGHT]: {
        hours: 0,
        rate: baseHourlyRate * SCHADS_LOADINGS[SchadsTimeBand.WEEKDAY_NIGHT],
        cost: 0,
      },
      [SchadsTimeBand.SATURDAY]: {
        hours: 0,
        rate: baseHourlyRate * SCHADS_LOADINGS[SchadsTimeBand.SATURDAY],
        cost: 0,
      },
      [SchadsTimeBand.SUNDAY]: {
        hours: 0,
        rate: baseHourlyRate * SCHADS_LOADINGS[SchadsTimeBand.SUNDAY],
        cost: 0,
      },
      [SchadsTimeBand.PUBLIC_HOLIDAY]: {
        hours: 0,
        rate: baseHourlyRate * SCHADS_LOADINGS[SchadsTimeBand.PUBLIC_HOLIDAY],
        cost: 0,
      },
    };

    const holidayKeys = new Set(publicHolidays.map((d) => this.dateKey(d)));
    let totalHours = 0;

    for (const shift of shifts) {
      const durationHours = this.shiftDurationHours(shift);
      totalHours += durationHours;
      const band = this.classifyShift(shift, holidayKeys);
      byBand[band].hours += durationHours;
    }

    for (const band of Object.values(byBand)) {
      band.cost = band.hours * band.rate;
    }

    const totalCost = Object.values(byBand).reduce((sum, b) => sum + b.cost, 0);

    return {
      totalHours,
      baseHours: totalHours,
      overtimeHours: Math.max(0, totalHours - SCHADS_LIMITS.MAX_WEEKLY_HOURS),
      byBand,
      totalCost,
      baseRate: baseHourlyRate,
    };
  }

  private classifyShift(shift: ShiftLike, holidayKeys: Set<string>): SchadsTimeBand {
    const start = shift.scheduledStart;
    const dayKey = this.dateKey(start);

    if (holidayKeys.has(dayKey)) return SchadsTimeBand.PUBLIC_HOLIDAY;

    const dayOfWeek = start.getDay();
    if (dayOfWeek === 0) return SchadsTimeBand.SUNDAY;
    if (dayOfWeek === 6) return SchadsTimeBand.SATURDAY;

    const hour = start.getHours();
    if (hour >= 6 && hour < 20) return SchadsTimeBand.WEEKDAY_DAY;
    if (hour >= 20 || hour < 0) return SchadsTimeBand.WEEKDAY_EVENING;
    return SchadsTimeBand.WEEKDAY_NIGHT;
  }

  private shiftDurationHours(shift: ShiftLike): number {
    const totalMinutes =
      (shift.scheduledEnd.getTime() - shift.scheduledStart.getTime()) / 60000;
    const billableMinutes = totalMinutes - (shift.breakMinutes || 0);
    return Math.max(0, billableMinutes / 60);
  }

  private dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private weekKey(d: Date): string {
    const start = new Date(d);
    const day = start.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    start.setDate(start.getDate() + diff);
    return this.dateKey(start);
  }

  private groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
    const map = new Map<K, T[]>();
    for (const item of items) {
      const key = keyFn(item);
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }
}
