import type { AvatarProps } from '@/types';

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
};

export function Avatar({
  src,
  alt = 'Avatar',
  size = 'md',
  className = '',
  fallbackIcon = 'person',
}: AvatarProps) {
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden bg-white/5 ${className}`}>
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-[#3c3cf6] to-purple-600 flex items-center justify-center ${className}`}
    >
      <span className="material-symbols-outlined text-white">{fallbackIcon}</span>
    </div>
  );
}
