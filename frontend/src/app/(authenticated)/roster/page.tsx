'use client';

import { useMemo, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useCalendarShifts } from '@/hooks/use-shifts';
import { useSupportWorkers } from '@/hooks/use-users';
import { WeekNav } from '@/components/roster/week-nav';
import { WeekCalendar } from '@/components/roster/week-calendar';
import { CreateShiftModal } from '@/components/roster/create-shift-modal';
import { ShiftDrawer } from '@/components/roster/shift-drawer';
import {
  getWeekStart,
  getWeekDays,
  getWeekRange,
  shiftWeek,
} from '@/lib/calendar-utils';
import type { CalendarShift } from '@/types/shift';

export default function RosterPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | 'ALL'>('ALL');

  // Modal state (create shift)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalHour, setModalHour] = useState<number | null>(null);

  // Drawer state (shift details)
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const { startISO, endISO } = useMemo(() => getWeekRange(weekStart), [weekStart]);

  const workers = useSupportWorkers();
  const shifts = useCalendarShifts(
    startISO,
    endISO,
    selectedWorkerId === 'ALL' ? undefined : selectedWorkerId,
  );

  const handleShiftClick = (shift: CalendarShift) => {
    setSelectedShiftId(shift.id);
  };

  const handleSlotClick = (date: Date, hour: number) => {
    setModalDate(date);
    setModalHour(hour);
    setModalOpen(true);
  };

  const handleNewShift = () => {
    setModalDate(new Date());
    setModalHour(9);
    setModalOpen(true);
  };

  const isLoading = shifts.isLoading || workers.isLoading;
  const isError = shifts.isError || workers.isError;
  const shiftsData = shifts.data ?? [];
  const workersData = workers.data ?? [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Roster</h1>
          <p className="mt-1 text-sm text-ink-500">
            Schedule and manage shifts across your team.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <WeekNav
          weekStart={weekStart}
          workers={workersData}
          selectedWorkerId={selectedWorkerId}
          onPrevWeek={() => setWeekStart((w) => shiftWeek(w, -1))}
          onNextWeek={() => setWeekStart((w) => shiftWeek(w, 1))}
          onToday={() => setWeekStart(getWeekStart(new Date()))}
          onWorkerChange={setSelectedWorkerId}
          onNewShift={handleNewShift}
        />

        {isLoading && (
          <div className="flex items-center justify-center px-6 py-24">
            <Spinner size="lg" />
          </div>
        )}

        {isError && (
          <div className="px-6 py-24 text-center">
            <p className="text-sm text-rose-600">
              Failed to load roster. {(shifts.error as Error)?.message ?? ''}
            </p>
          </div>
        )}

        {!isLoading && !isError && shiftsData.length === 0 && (
          <div className="px-6 py-12">
            <EmptyState
              icon={<CalendarRange className="h-6 w-6" />}
              title="No shifts this week"
              description="Click any time slot in the calendar below to create a new shift."
            />
            <div className="mt-6">
              <WeekCalendar
                weekDays={weekDays}
                shifts={[]}
                onSlotClick={handleSlotClick}
                onShiftClick={handleShiftClick}
              />
            </div>
          </div>
        )}

        {!isLoading && !isError && shiftsData.length > 0 && (
          <WeekCalendar
            weekDays={weekDays}
            shifts={shiftsData}
            onSlotClick={handleSlotClick}
            onShiftClick={handleShiftClick}
          />
        )}
      </Card>

      <CreateShiftModal
        open={modalOpen}
        initialDate={modalDate}
        initialHour={modalHour}
        onClose={() => setModalOpen(false)}
      />

      <ShiftDrawer shiftId={selectedShiftId} onClose={() => setSelectedShiftId(null)} />
    </div>
  );
}
