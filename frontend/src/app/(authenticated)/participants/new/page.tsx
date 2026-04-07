'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ParticipantForm } from '@/components/participants/participant-form';
import { useCreateParticipant } from '@/hooks/use-participants';
import type { CreateParticipantInput } from '@/types/participant';

export default function NewParticipantPage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateParticipant();

  const handleSubmit = async (values: CreateParticipantInput) => {
    const created = await mutateAsync(values);
    toast.success(`${created.firstName} ${created.lastName} added`);
    router.push(`/participants/${created.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/participants')}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to participants
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Add participant</h1>
        <p className="mt-1 text-sm text-ink-500">
          Create a new participant record. You can add their NDIS plan and service agreement after.
        </p>
      </div>

      <ParticipantForm
        onSubmit={handleSubmit}
        submitLabel="Add participant"
        isSubmitting={isPending}
      />
    </div>
  );
}
