'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { useParticipant } from '@/hooks/use-participants';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  ParticipantStatusBadge,
  ManagementTypeBadge,
  getManagementLabel,
} from '@/components/participants/participant-status-badge';

function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ParticipantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: participant, isLoading, isError } = useParticipant(params.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !participant) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/participants')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to participants
        </Button>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3 py-6 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">Participant not found or you don't have access.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${participant.firstName} ${participant.lastName}`;
  const age = calculateAge(participant.dateOfBirth);
  const activePlans = participant.ndisPlans?.filter((p) => p.status === 'ACTIVE') ?? [];
  const activeAgreements =
    participant.serviceAgreements?.filter((a) => a.status === 'ACTIVE') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/participants')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to participants
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{fullName}</h1>
            <ParticipantStatusBadge status={participant.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-ink-500">
            <span className="font-mono">{participant.ndisNumber}</span>
            <span>•</span>
            <span>
              {age} years old · born {formatDate(participant.dateOfBirth)}
            </span>
            <span>•</span>
            <span>{getManagementLabel(participant.managementType)}</span>
          </div>
          {participant.preferredName && (
            <p className="text-sm text-ink-600">
              Goes by <span className="font-medium">"{participant.preferredName}"</span>
            </p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/participants/${participant.id}/edit`)}
        >
          <Edit className="mr-1.5 h-4 w-4" />
          Edit details
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>NDIS plans</CardTitle>
            </CardHeader>
            <CardContent>
              {activePlans.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-ink-500">No active NDIS plan on file.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push(`/participants/${participant.id}/plans/new`)}
                  >
                    Add NDIS plan
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activePlans.map((plan) => (
                    <Link
                      key={plan.id}
                      href={`/ndis-plans/${plan.id}`}
                      className="flex items-center justify-between rounded-md border border-ink-100 p-3 transition-colors hover:border-ink-200 hover:bg-ink-50/40"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink-900">
                          Plan {plan.planNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {formatDate(plan.startDate)} → {formatDate(plan.endDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums text-ink-900">
                          {formatCurrency(plan.totalBudget)}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-500">total budget</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active service agreements</CardTitle>
            </CardHeader>
            <CardContent>
              {activeAgreements.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-ink-500">No active service agreements.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push(`/service-agreements/new?participant=${participant.id}`)}
                  >
                    Create agreement
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAgreements.map((agreement) => (
                    <Link
                      key={agreement.id}
                      href={`/service-agreements/${agreement.id}`}
                      className="flex items-center justify-between rounded-md border border-ink-100 p-3 transition-colors hover:border-ink-200 hover:bg-ink-50/40"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink-900">
                          {agreement.agreementNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {formatDate(agreement.startDate)} → {formatDate(agreement.endDate)}
                        </p>
                      </div>
                      <p className="text-sm font-medium tabular-nums text-ink-900">
                        {formatCurrency(agreement.totalValue)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {participant.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-ink-700">{participant.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {participant.email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-400" />
                  <a
                    href={`mailto:${participant.email}`}
                    className="break-all text-sm text-accent-700 hover:underline"
                  >
                    {participant.email}
                  </a>
                </div>
              )}
              {participant.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-400" />
                  <a
                    href={`tel:${participant.phone}`}
                    className="text-sm text-accent-700 hover:underline"
                  >
                    {participant.phone}
                  </a>
                </div>
              )}
              {participant.addressLine1 && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-400" />
                  <div className="text-sm text-ink-700">
                    <p>{participant.addressLine1}</p>
                    {participant.addressLine2 && <p>{participant.addressLine2}</p>}
                    {(participant.suburb || participant.state || participant.postcode) && (
                      <p>
                        {[participant.suburb, participant.state, participant.postcode]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {!participant.email && !participant.phone && !participant.addressLine1 && (
                <p className="text-xs text-ink-400">No contact details on file.</p>
              )}
            </CardContent>
          </Card>

          {participant.managementType === 'PLAN_MANAGED' && participant.planManagerName && (
            <Card>
              <CardHeader>
                <CardTitle>Plan manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <p className="font-medium text-ink-900">{participant.planManagerName}</p>
                {participant.planManagerEmail && (
                  <a
                    href={`mailto:${participant.planManagerEmail}`}
                    className="block break-all text-xs text-accent-700 hover:underline"
                  >
                    {participant.planManagerEmail}
                  </a>
                )}
                {participant.planManagerPhone && (
                  <a
                    href={`tel:${participant.planManagerPhone}`}
                    className="block text-xs text-accent-700 hover:underline"
                  >
                    {participant.planManagerPhone}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {participant.emergencyContactName && (
            <Card>
              <CardHeader>
                <CardTitle>Emergency contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <p className="font-medium text-ink-900">{participant.emergencyContactName}</p>
                {participant.emergencyContactRelationship && (
                  <p className="text-xs text-ink-500">
                    {participant.emergencyContactRelationship}
                  </p>
                )}
                {participant.emergencyContactPhone && (
                  <a
                    href={`tel:${participant.emergencyContactPhone}`}
                    className="block text-xs text-accent-700 hover:underline"
                  >
                    {participant.emergencyContactPhone}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-ink-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Added {formatDate(participant.createdAt)}</span>
              </div>
              {participant._count && (
                <>
                  <p>{participant._count.shifts} shifts logged</p>
                  {participant._count.incidents > 0 && (
                    <p className="text-amber-700">
                      {participant._count.incidents} incident
                      {participant._count.incidents !== 1 ? 's' : ''} on record
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
