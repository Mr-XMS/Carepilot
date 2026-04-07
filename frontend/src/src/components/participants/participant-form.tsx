'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field } from '@/components/ui/field';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { Participant, CreateParticipantInput, ManagementType } from '@/types/participant';

const ndisNumberRegex = /^\d{9}$/;
const auPhoneRegex = /^(\+?61|0)[2-478](?:[ -]?[0-9]){8}$/;
const postcodeRegex = /^\d{4}$/;

const participantSchema = z.object({
  ndisNumber: z
    .string()
    .regex(ndisNumberRegex, 'NDIS number must be exactly 9 digits'),
  firstName: z.string().min(1, 'First name is required').max(80),
  lastName: z.string().min(1, 'Last name is required').max(80),
  preferredName: z.string().max(80).optional().or(z.literal('')),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    }, 'Date of birth must be in the past'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(auPhoneRegex, 'Invalid Australian phone number')
    .optional()
    .or(z.literal('')),
  addressLine1: z.string().max(120).optional().or(z.literal('')),
  addressLine2: z.string().max(120).optional().or(z.literal('')),
  suburb: z.string().max(80).optional().or(z.literal('')),
  state: z.string().max(20).optional().or(z.literal('')),
  postcode: z
    .string()
    .regex(postcodeRegex, 'Postcode must be 4 digits')
    .optional()
    .or(z.literal('')),
  managementType: z.enum(['NDIA_MANAGED', 'PLAN_MANAGED', 'SELF_MANAGED']),
  planManagerName: z.string().max(120).optional().or(z.literal('')),
  planManagerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  planManagerPhone: z.string().optional().or(z.literal('')),
  emergencyContactName: z.string().max(120).optional().or(z.literal('')),
  emergencyContactPhone: z.string().optional().or(z.literal('')),
  emergencyContactRelationship: z.string().max(60).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type ParticipantFormValues = z.infer<typeof participantSchema>;

interface ParticipantFormProps {
  defaultValues?: Partial<Participant>;
  onSubmit: (values: CreateParticipantInput) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
}

const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'] as const;

function emptyToUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = value === '' ? undefined : value;
  }
  return result as T;
}

export function ParticipantForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save participant',
  isSubmitting = false,
}: ParticipantFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      ndisNumber: defaultValues?.ndisNumber ?? '',
      firstName: defaultValues?.firstName ?? '',
      lastName: defaultValues?.lastName ?? '',
      preferredName: defaultValues?.preferredName ?? '',
      dateOfBirth: defaultValues?.dateOfBirth?.split('T')[0] ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      addressLine1: defaultValues?.addressLine1 ?? '',
      addressLine2: defaultValues?.addressLine2 ?? '',
      suburb: defaultValues?.suburb ?? '',
      state: defaultValues?.state ?? '',
      postcode: defaultValues?.postcode ?? '',
      managementType: (defaultValues?.managementType as ManagementType) ?? 'NDIA_MANAGED',
      planManagerName: defaultValues?.planManagerName ?? '',
      planManagerEmail: defaultValues?.planManagerEmail ?? '',
      planManagerPhone: defaultValues?.planManagerPhone ?? '',
      emergencyContactName: defaultValues?.emergencyContactName ?? '',
      emergencyContactPhone: defaultValues?.emergencyContactPhone ?? '',
      emergencyContactRelationship: defaultValues?.emergencyContactRelationship ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  const managementType = watch('managementType');

  const submit = async (values: ParticipantFormValues) => {
    try {
      const cleaned = emptyToUndefined(values) as CreateParticipantInput;
      await onSubmit(cleaned);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>
            NDIS-issued details. Required for plan and claim matching.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field error={errors.ndisNumber?.message}>
            <Label htmlFor="ndisNumber">NDIS number</Label>
            <Input
              id="ndisNumber"
              placeholder="430000000"
              maxLength={9}
              {...register('ndisNumber')}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field error={errors.firstName?.message}>
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register('firstName')} />
            </Field>
            <Field error={errors.lastName?.message}>
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register('lastName')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field error={errors.preferredName?.message}>
              <Label htmlFor="preferredName">
                Preferred name <span className="text-ink-400">(optional)</span>
              </Label>
              <Input id="preferredName" {...register('preferredName')} />
            </Field>
            <Field error={errors.dateOfBirth?.message}>
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field error={errors.email?.message}>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
            </Field>
            <Field error={errors.phone?.message}>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="0412 345 678" {...register('phone')} />
            </Field>
          </div>
          <Field error={errors.addressLine1?.message}>
            <Label htmlFor="addressLine1">Address line 1</Label>
            <Input id="addressLine1" {...register('addressLine1')} />
          </Field>
          <Field error={errors.addressLine2?.message}>
            <Label htmlFor="addressLine2">
              Address line 2 <span className="text-ink-400">(optional)</span>
            </Label>
            <Input id="addressLine2" {...register('addressLine2')} />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field error={errors.suburb?.message}>
              <Label htmlFor="suburb">Suburb</Label>
              <Input id="suburb" {...register('suburb')} />
            </Field>
            <Field error={errors.state?.message}>
              <Label htmlFor="state">State</Label>
              <select
                id="state"
                {...register('state')}
                className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                <option value="">—</option>
                {AU_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field error={errors.postcode?.message}>
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" maxLength={4} {...register('postcode')} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NDIS plan management</CardTitle>
          <CardDescription>
            How this participant's NDIS funding is managed determines who you bill.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field error={errors.managementType?.message}>
            <Label htmlFor="managementType">Management type</Label>
            <select
              id="managementType"
              {...register('managementType')}
              className="h-10 w-full rounded-md border border-ink-200 bg-white px-3 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            >
              <option value="NDIA_MANAGED">NDIA managed — bill the agency directly</option>
              <option value="PLAN_MANAGED">Plan managed — bill the plan manager</option>
              <option value="SELF_MANAGED">Self managed — bill the participant</option>
            </select>
          </Field>

          {managementType === 'PLAN_MANAGED' && (
            <div className="space-y-4 rounded-md border border-ink-100 bg-ink-50/40 p-4">
              <p className="text-xs text-ink-600">
                Plan manager details are required for invoicing. Invoices for this participant will be sent to the plan manager.
              </p>
              <Field error={errors.planManagerName?.message}>
                <Label htmlFor="planManagerName">Plan manager name</Label>
                <Input id="planManagerName" {...register('planManagerName')} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field error={errors.planManagerEmail?.message}>
                  <Label htmlFor="planManagerEmail">Email</Label>
                  <Input id="planManagerEmail" type="email" {...register('planManagerEmail')} />
                </Field>
                <Field error={errors.planManagerPhone?.message}>
                  <Label htmlFor="planManagerPhone">Phone</Label>
                  <Input id="planManagerPhone" type="tel" {...register('planManagerPhone')} />
                </Field>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Emergency contact <span className="text-ink-400">(optional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field error={errors.emergencyContactName?.message}>
              <Label htmlFor="emergencyContactName">Name</Label>
              <Input id="emergencyContactName" {...register('emergencyContactName')} />
            </Field>
            <Field error={errors.emergencyContactRelationship?.message}>
              <Label htmlFor="emergencyContactRelationship">Relationship</Label>
              <Input
                id="emergencyContactRelationship"
                placeholder="e.g. Mother, Brother, Carer"
                {...register('emergencyContactRelationship')}
              />
            </Field>
          </div>
          <Field error={errors.emergencyContactPhone?.message}>
            <Label htmlFor="emergencyContactPhone">Phone</Label>
            <Input id="emergencyContactPhone" type="tel" {...register('emergencyContactPhone')} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Notes <span className="text-ink-400">(optional)</span>
          </CardTitle>
          <CardDescription>
            Internal notes only. Not shared with NDIS or external parties.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field error={errors.notes?.message}>
            <textarea
              id="notes"
              rows={4}
              {...register('notes')}
              className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
