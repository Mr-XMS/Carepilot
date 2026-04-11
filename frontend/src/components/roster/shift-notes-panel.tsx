'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useShiftNotes, useCreateShiftNote, useDeleteShiftNote } from '@/hooks/use-shift-notes';
import { useAuth } from '@/hooks/use-auth';
import type { NoteType } from '@/types/shift-note';

const NOTE_TYPES: { value: NoteType; label: string }[] = [
  { value: 'PROGRESS', label: 'Progress' },
  { value: 'HANDOVER', label: 'Handover' },
  { value: 'INCIDENT', label: 'Incident' },
  { value: 'GENERAL', label: 'General' },
];

const noteTypeBadge: Record<NoteType, 'info' | 'warning' | 'danger' | 'default'> = {
  PROGRESS: 'info',
  HANDOVER: 'default',
  INCIDENT: 'danger',
  GENERAL: 'default',
};

interface ShiftNotesPanelProps {
  shiftId: string;
}

export function ShiftNotesPanel({ shiftId }: ShiftNotesPanelProps) {
  const { user } = useAuth();
  const { data: notes, isLoading } = useShiftNotes(shiftId);
  const createNote = useCreateShiftNote();
  const deleteNote = useDeleteShiftNote();

  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('PROGRESS');

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      await createNote.mutateAsync({ shiftId, content: content.trim(), noteType });
      setContent('');
      setShowForm(false);
    } catch {
      /* toast in hook */
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!window.confirm('Delete this note?')) return;
    await deleteNote.mutateAsync({ shiftId, noteId });
  };

  return (
    <div className="border-t border-ink-100 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-ink-500">
          Notes ({notes?.length ?? 0})
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 font-medium"
          >
            <Plus className="h-3 w-3" />
            Add note
          </button>
        )}
      </div>

      {/* Add note form */}
      {showForm && (
        <div className="mb-4 space-y-2 rounded-md border border-ink-200 p-3">
          <div className="flex gap-2">
            {NOTE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setNoteType(t.value)}
                className={`px-2 py-0.5 text-xs rounded-md border transition-colors ${
                  noteType === t.value
                    ? 'border-accent-500 bg-accent-50 text-accent-700'
                    : 'border-ink-200 text-ink-500 hover:border-ink-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a note..."
            rows={3}
            autoFocus
            className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowForm(false); setContent(''); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              loading={createNote.isPending}
              disabled={!content.trim()}
            >
              Save note
            </Button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      )}

      {!isLoading && notes && notes.length === 0 && !showForm && (
        <div className="flex flex-col items-center py-4 text-center">
          <MessageSquare className="h-5 w-5 text-ink-300 mb-1" />
          <p className="text-xs text-ink-400">No notes yet</p>
        </div>
      )}

      {notes && notes.length > 0 && (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-md border border-ink-100 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant={noteTypeBadge[note.noteType]}>
                    {note.noteType.charAt(0) + note.noteType.slice(1).toLowerCase()}
                  </Badge>
                  <span className="text-xs text-ink-500">
                    {note.user.firstName} {note.user.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-ink-400">
                    {format(new Date(note.createdAt), 'd MMM, h:mm a')}
                  </span>
                  {user?.id === note.userId && (
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-ink-300 hover:text-rose-500 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-ink-800 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
