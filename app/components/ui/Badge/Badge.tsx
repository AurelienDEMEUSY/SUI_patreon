'use client';

import { cn } from '@/lib';
import type { BadgeProps } from './Badge.types';

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className,
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-white/10 border border-white/20 text-white/80',
    primary: 'bg-[#3c3cf6]/20 border border-[#3c3cf6]/40 text-[#3c3cf6]',
    success: 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const classes = cn(
    'inline-flex items-center justify-center rounded-full font-semibold transition-all',
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
