'use client';

import { cn } from '@/lib';
import type { CardProps } from './Card.types';

export function Card({
  variant = 'glass',
  hover = false,
  blur = 'md',
  children,
  className,
  ...props
}: CardProps) {
  const variantClasses = {
    glass: 'glass-card',
    solid: 'bg-white/5 border border-white/10',
    bordered: 'bg-transparent border-2 border-white/20',
  };

  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
  };

  const classes = cn(
    'rounded-xl',
    variantClasses[variant],
    variant === 'glass' && blurClasses[blur],
    hover && 'hover-lift cursor-pointer',
    className
  );

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
