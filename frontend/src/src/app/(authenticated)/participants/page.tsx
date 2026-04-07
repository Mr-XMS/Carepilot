'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParticipants } from '@/hooks/use-participants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ParticipantStatusBadge,
  ManagementTypeBadge,
} from '@/components/participants/participant-status-badge';
import type { ParticipantStatus } from '@/types/participant';

const PAGE_SIZE = 25;

export default function ParticipantsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ParticipantStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useParticipants({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status === 'ALL' ? undefined : status,
  });

  const participants = data?.data ?? [];
  const meta = data?.meta;
  const hasFilters = search.length > 0 || status !== 'ALL';

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Participants</h1>
          <p className="mt-1 text-sm text-ink-500">
            People you support, their plans, and their service agreements.
          </p>
        </div>
        <Button onClick={() => router.push('/participants/new')}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add participant
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              type="search"
              placeholder="Search by name or NDIS number"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ParticipantStatus | 'ALL');
              setPage(1);
            }}
            className="rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On hold</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center px-6 py-16">
            <Spinner size="lg" />
          </div>
        )}

        {isError && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-rose-600">
              Failed to load participants. {(error as Error)?.message}
            </p>
          </div>
        )}

        {!isLoading && !isError && participants.length === 0 && (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={hasFilters ? 'No participants match your filters' : 'No participants yet'}
            description={
              hasFilters
                ? 'Try adjusting your search or clearing the status filter.'
                : 'Add your first participant to start building plans, agreements, and rosters.'
            }
            action={
              hasFilters ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch('');
                    setStatus('ALL');
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => router.push('/participants/new')}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Add your first participant
                </Button>
              )
            }
          />
        )}

        {!isLoading && !isError && participants.length > 0 && (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
                    NDIS number
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
                    Management
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-ink-500">
                    Date of birth
                  </th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => (
                  <tr
                    key={participant.id}
                    className="cursor-pointer border-b border-ink-100 transition-colors last:border-0 hover:bg-ink-50/40"
                    onClick={() => router.push(`/participants/${participant.id}`)}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/participants/${participant.id}`}
                        className="text-sm font-medium text-ink-900 hover:text-accent-700"
                      >
                        {participant.firstName} {participant.lastName}
                      </Link>
                      {participant.preferredName && (
                        <p className="text-xs text-ink-500">"{participant.preferredName}"</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-600">
                      {participant.ndisNumber}
                    </td>
                    <td className="px-4 py-3">
                      <ManagementTypeBadge type={participant.managementType} short />
                    </td>
                    <td className="px-4 py-3">
                      <ParticipantStatusBadge status={participant.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-ink-600">
                      {new Date(participant.dateOfBirth).toLocaleDateString('en-AU', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3">
                <p className="text-xs text-ink-500">
                  Showing {(meta.page - 1) * meta.limit + 1}–
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="px-2 text-xs tabular-nums text-ink-600">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={meta.page >= meta.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
