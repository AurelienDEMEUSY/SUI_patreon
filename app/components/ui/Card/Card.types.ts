import type { HTMLAttributes, ReactNode } from 'react';
import type { CardVariant, BlurAmount } from '@/types';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
  blur?: BlurAmount;
  children: ReactNode;
}
