import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Label } from './label';

interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, required, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-rose-600 ml-0.5">*</span>}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-400 mt-1.5">{hint}</p>}
      {error && <p className="text-xs text-rose-600 mt-1.5">{error}</p>}
    </div>
  );
}
