import type { HTMLAttributes, ReactNode } from 'react';
import type { BadgeVariant, BadgeSize } from '@/types';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
}
