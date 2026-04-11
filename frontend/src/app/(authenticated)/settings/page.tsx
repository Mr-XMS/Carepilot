'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Users, Search, UserX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  useAllUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
} from '@/hooks/use-users';
import { Sheet } from '@/components/ui/sheet';
import { X } from 'lucide-react';
import type { UserRole, EmploymentType, User } from '@/types/user';

const roleLabels: Record<UserRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  COORDINATOR: 'Coordinator',
  SUPPORT_WORKER: 'Support worker',
  BILLING: 'Billing',
};

const roleBadge: Record<UserRole, 'danger' | 'warning' | 'info' | 'default' | 'success'> = {
  OWNER: 'danger',
  ADMIN: 'warning',
  COORDINATOR: 'info',
  SUPPORT_WORKER: 'default',
  BILLING: 'default',
};

const employmentLabels: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CASUAL: 'Casual',
  CONTRACTOR: 'Contractor',
};

export default function SettingsPage() {
  const [showInactive, setShowInactive] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data: users, isLoading, error } = useAllUsers({
    activeOnly: showInactive ? 'false' : 'true',
  });

  const deactivate = useDeactivateUser();

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this staff member? They will no longer be able to log in.')) return;
    await deactivate.mutateAsync(id);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink-900">Team</h1>
          <p className="text-sm text-ink-500">Manage staff members and roles</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add staff member
        </Button>
      </div>

      <Card className="p-4">
        <label className="inline-flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-accent-600"
          />
          Show inactive members
        </label>
      </Card>

      <Card>
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <p className="py-8 text-center text-sm text-rose-600">Failed to load team.</p>
        )}

        {!isLoading && !error && users?.length === 0 && (
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title="No team members"
            description="Add staff members to get started."
            action={
              <Button size="sm" onClick={() => setAddOpen(true)}>
                Add staff member
              </Button>
            }
          />
        )}

        {!isLoading && users && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left">
                  <th className="px-4 py-3 font-medium text-ink-600">Name</th>
                  <th className="px-4 py-3 font-medium text-ink-600">Email</th>
                  <th className="px-4 py-3 font-medium text-ink-600">Role</th>
                  <th className="px-4 py-3 font-medium text-ink-600">Employment</th>
                  <th className="px-4 py-3 font-medium text-ink-600 text-right">Rate</th>
                  <th className="px-4 py-3 font-medium text-ink-600">Status</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-ink-50 transition-colors">
                    <td className="px-4 py-3 text-ink-900 font-medium">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={roleBadge[u.role] || 'default'}>
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-600 text-xs">
                      {u.employmentType ? employmentLabels[u.employmentType] : '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-700 text-right">
                      {u.hourlyRate ? `$${Number(u.hourlyRate).toFixed(2)}/hr` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditUser(u)}
                        >
                          Edit
                        </Button>
                        {u.isActive && u.role !== 'OWNER' && (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            className="text-ink-300 hover:text-rose-500 p-1 transition-colors"
                            title="Deactivate"
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddStaffModal open={addOpen} onClose={() => setAddOpen(false)} />
      {editUser && (
        <EditStaffModal
          open={!!editUser}
          onClose={() => setEditUser(null)}
          user={editUser}
        />
      )}
    </div>
  );
}

// ---------- Add Staff Modal ----------

function AddStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('SUPPORT_WORKER');
  const [phone, setPhone] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [hourlyRate, setHourlyRate] = useState('');

  const create = useCreateUser();

  const handleClose = () => {
    setFirstName(''); setLastName(''); setEmail(''); setPassword('');
    setRole('SUPPORT_WORKER'); setPhone(''); setEmploymentType(''); setHourlyRate('');
    onClose();
  };

  const handleSubmit = async () => {
    try {
      await create.mutateAsync({
        firstName, lastName, email, password, role,
        ...(phone && { phone }),
        ...(employmentType && { employmentType }),
        ...(hourlyRate && { hourlyRate: Number(hourlyRate) }),
      });
      handleClose();
    } catch { /* toast */ }
  };

  const isValid = firstName && lastName && email && password.length >= 8;

  return (
    <Sheet open={open} onClose={handleClose} side="center" widthClass="w-full max-w-lg" ariaLabel="Add staff member">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">Add staff member</h2>
        <button type="button" onClick={handleClose} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[70vh]">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First name" required>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
          </FormField>
          <FormField label="Last name" required>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
          </FormField>
        </div>
        <FormField label="Email" required>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
        </FormField>
        <FormField label="Password" required hint="Minimum 8 characters">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500">
              {Object.entries(roleLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FormField>
          <FormField label="Employment type">
            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as EmploymentType)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500">
              <option value="">Not set</option>
              {Object.entries(employmentLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0400 000 000" className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
          </FormField>
          <FormField label="Hourly rate ($)">
            <input type="number" min={0} step={0.01} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="0.00" className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
          </FormField>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">
        <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} loading={create.isPending} disabled={!isValid}>
          Add member
        </Button>
      </div>
    </Sheet>
  );
}

// ---------- Edit Staff Modal ----------

function EditStaffModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [role, setRole] = useState<UserRole>(user.role);
  const [phone, setPhone] = useState(user.phone || '');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>(user.employmentType || '');
  const [hourlyRate, setHourlyRate] = useState(user.hourlyRate ? String(Number(user.hourlyRate)) : '');

  const update = useUpdateUser();

  const handleSubmit = async () => {
    try {
      await update.mutateAsync({
        id: user.id, firstName, lastName, role,
        phone: phone || undefined,
        ...(employmentType && { employmentType }),
        ...(hourlyRate && { hourlyRate: Number(hourlyRate) }),
      });
      onClose();
    } catch { /* toast */ }
  };

  return (
    <Sheet open={open} onClose={onClose} side="center" widthClass="w-full max-w-lg" ariaLabel="Edit staff member">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">Edit staff member</h2>
        <button type="button" onClick={onClose} className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 max-h-[70vh]">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="First name">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
          </FormField>
          <FormField label="Last name">
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
          </FormField>
        </div>
        <FormField label="Email">
          <input value={user.email} disabled className="w-full rounded-md border border-ink-100 bg-ink-50 px-3 py-1.5 text-sm text-ink-500" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500">
              {Object.entries(roleLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FormField>
          <FormField label="Employment type">
            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as EmploymentType)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500">
              <option value="">Not set</option>
              {Object.entries(employmentLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
          </FormField>
          <FormField label="Hourly rate ($)">
            <input type="number" min={0} step={0.01} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="w-full rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500" />
          </FormField>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} loading={update.isPending}>
          Save changes
        </Button>
      </div>
    </Sheet>
  );
}

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-600 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-ink-400 mt-0.5">{hint}</p>}
    </div>
  );
}
