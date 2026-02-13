import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { ButtonVariant, ButtonSize } from '@/types';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}
