'use client';

export interface CreatorsErrorStateProps {
  message: string;
}

export function CreatorsErrorState({ message }: CreatorsErrorStateProps) {
  return (
    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 text-red-300">
      <span className="material-symbols-outlined">error</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
