'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ParticipantForm } from '@/components/participants/participant-form';
import { useParticipant, useUpdateParticipant } from '@/hooks/use-participants';
import type { CreateParticipantInput } from '@/types/participant';

export default function EditParticipantPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: participant, isLoading } = useParticipant(params.id);
  const { mutateAsync, isPending } = useUpdateParticipant(params.id);

  const handleSubmit = async (values: CreateParticipantInput) => {
    await mutateAsync(values);
    toast.success('Participant updated');
    router.push(`/participants/${params.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/participants')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to participants
        </Button>
        <p className="text-sm text-rose-600">Participant not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push(`/participants/${params.id}`)}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to {participant.firstName} {participant.lastName}
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Edit participant</h1>
        <p className="mt-1 text-sm text-ink-500">
          Update {participant.firstName}'s details. Changes are saved immediately when you click save.
        </p>
      </div>

      <ParticipantForm
        defaultValues={participant}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
        isSubmitting={isPending}
      />
    </div>
  );
}
