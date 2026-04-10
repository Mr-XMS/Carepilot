'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types/user';
import { formatWeekRange } from '@/lib/calendar-utils';

interface WeekNavProps {
  weekStart: Date;
  workers: User[];
  selectedWorkerId: string | 'ALL';
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onWorkerChange: (workerId: string | 'ALL') => void;
}

export function WeekNav({
  weekStart,
  workers,
  selectedWorkerId,
  onPrevWeek,
  onNextWeek,
  onToday,
  onWorkerChange,
}: WeekNavProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrevWeek} aria-label="Previous week">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <Button variant="outline" size="sm" onClick={onNextWeek} aria-label="Next week">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <p className="ml-2 text-sm font-medium tabular-nums text-ink-900">
          {formatWeekRange(weekStart)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="worker-filter" className="text-xs text-ink-500">
          Worker
        </label>
        <select
          id="worker-filter"
          value={selectedWorkerId}
          onChange={(e) => onWorkerChange(e.target.value as string | 'ALL')}
          className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        >
          <option value="ALL">All workers</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.firstName} {w.lastName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
