import { Badge } from '@/components/ui/badge';
import type { ParticipantStatus, ManagementType } from '@/types/participant';

const statusConfig: Record<ParticipantStatus, { label: string; variant: 'success' | 'muted' | 'warning' }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  INACTIVE: { label: 'Inactive', variant: 'muted' },
  ON_HOLD: { label: 'On hold', variant: 'warning' },
};

export function ParticipantStatusBadge({ status }: { status: ParticipantStatus }) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const managementConfig: Record<ManagementType, { label: string; short: string }> = {
  NDIA_MANAGED: { label: 'NDIA managed', short: 'NDIA' },
  PLAN_MANAGED: { label: 'Plan managed', short: 'Plan' },
  SELF_MANAGED: { label: 'Self managed', short: 'Self' },
};

export function ManagementTypeBadge({ type, short = false }: { type: ManagementType; short?: boolean }) {
  const config = managementConfig[type];
  return <Badge variant="info">{short ? config.short : config.label}</Badge>;
}

export function getManagementLabel(type: ManagementType): string {
  return managementConfig[type].label;
}
