import type { PageContainerProps } from '@/types';

/**
 * PageContainer — Standardized content wrapper for all app pages
 *
 * Provides consistent:
 * - Max width (7xl by default)
 * - Horizontal padding
 * - Bottom padding (for scroll comfort)
 * - Optional vertical spacing
 *
 * Usage:
 * ```tsx
 * <PageContainer>
 *   <YourPageContent />
 * </PageContainer>
 * ```
 */
export function PageContainer({
  children,
  maxWidth = 'max-w-7xl',
  noPadding = false,
  className = '',
}: PageContainerProps) {
  const baseClasses = noPadding
    ? 'pb-8'
    : 'px-4 sm:px-6 lg:px-8 pb-8';

  return (
    <div className={`${maxWidth} mx-auto w-full ${baseClasses} ${className}`}>
      {children}
    </div>
  );
}
