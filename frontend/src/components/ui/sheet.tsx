'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: 'right' | 'center';
  widthClass?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

/**
 * Overlay sheet — used for modals (`side="center"`) and drawers (`side="right"`).
 * Handles backdrop click, ESC key, and body scroll lock.
 */
export function Sheet({
  open,
  onClose,
  side = 'center',
  widthClass,
  children,
  ariaLabel,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  const isDrawer = side === 'right';
  const defaultWidth = isDrawer ? 'w-full max-w-md' : 'w-full max-w-lg';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 flex"
      onMouseDown={(e) => {
        // Close when clicking backdrop (not the panel itself)
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-900/30 backdrop-blur-[1px]" />

      {/* Panel */}
      <div
        className={cn(
          'relative flex',
          isDrawer ? 'ml-auto h-full' : 'm-auto items-center',
        )}
      >
        <div
          ref={panelRef}
          className={cn(
            'flex flex-col bg-white shadow-xl',
            isDrawer ? 'h-full' : 'rounded-lg',
            widthClass || defaultWidth,
            isDrawer ? 'max-h-screen' : 'max-h-[90vh]',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
