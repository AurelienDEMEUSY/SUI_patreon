import type { Step } from '@/types';

export interface HowItWorksProps {
  className?: string;
}

export interface StepCardProps {
  step: Step;
  isLast?: boolean;
}
