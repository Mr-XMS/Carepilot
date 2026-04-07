import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  default:
    'bg-ink-900 text-white hover:bg-ink-800 disabled:bg-ink-300 disabled:text-ink-500',
  outline:
    'border border-ink-200 bg-white text-ink-900 hover:border-ink-300 hover:bg-ink-50 disabled:border-ink-100 disabled:text-ink-400',
  ghost:
    'text-ink-700 hover:bg-ink-100 hover:text-ink-900 disabled:text-ink-400',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-200',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
