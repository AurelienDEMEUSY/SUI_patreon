'use client';

import Link from 'next/link';
import { cn } from '@/lib';
import type { ButtonProps } from './Button.types';

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  icon,
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses: Record<'primary' | 'secondary' | 'ghost', string> = {
    primary: 'bg-[#3c3cf6] text-white hover:bg-[#2828d0] hover:shadow-lg hover:shadow-primary/50 active:scale-95',
    secondary: 'glass-panel text-white hover:bg-white/10 active:scale-95',
    ghost: 'text-white hover:bg-white/10 active:scale-95',
  };

  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant as 'primary' | 'secondary' | 'ghost'],
    sizeClasses[size as 'sm' | 'md' | 'lg'],
    (loading || disabled) && 'opacity-50 cursor-not-allowed',
    className
  );

  const content = (
    <>
      {loading ? (
        <span className="animate-spin">⏳</span>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </>
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  );
}
