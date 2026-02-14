import type { ReactNode } from 'react';

export interface NoCreatorProfileProps {
    title: string;
    description: string;
    buttonLabel: string;
    onButtonClick: () => void;
    icon?: string;
    children?: ReactNode;
}
