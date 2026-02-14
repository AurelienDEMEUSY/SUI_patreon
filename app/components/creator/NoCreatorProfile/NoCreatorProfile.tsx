'use client';

import type { NoCreatorProfileProps } from './NoCreatorProfile.types';

export function NoCreatorProfile({
    title,
    description,
    buttonLabel,
    onButtonClick,
    icon = 'person_off',
    children,
}: NoCreatorProfileProps) {
    return (
        <div className="w-full flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-4xl text-gray-600">{icon}</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">{title}</h1>
            <p className="text-gray-500 max-w-sm mb-6">{description}</p>
            <button
                onClick={onButtonClick}
                className="px-6 py-3 bg-[#3c3cf6] hover:bg-[#3c3cf6]/90 text-white font-bold rounded-xl transition-all text-sm"
            >
                {buttonLabel}
            </button>
            {children}
        </div>
    );
}
