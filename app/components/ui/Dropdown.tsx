'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

const DropdownContext = createContext<{
    isOpen: boolean;
    toggle: () => void;
    close: () => void;
} | undefined>(undefined);

export function Dropdown({ children, className }: { children: React.ReactNode; className?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggle = () => setIsOpen((prev) => !prev);
    const close = () => setIsOpen(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                close();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <DropdownContext.Provider value={{ isOpen, toggle, close }}>
            <div ref={dropdownRef} className={cn('relative', className)}>
                {children}
            </div>
        </DropdownContext.Provider>
    );
}

export function DropdownTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
    const context = useContext(DropdownContext);
    if (!context) throw new Error('DropdownTrigger must be used within a Dropdown');

    return (
        <div onClick={(e) => { e.stopPropagation(); context.toggle(); }} className={cn('cursor-pointer', className)}>
            {children}
        </div>
    );
}

interface DropdownContentProps {
    children: React.ReactNode;
    className?: string;
    align?: 'top' | 'bottom' | 'left' | 'right';
}

export function DropdownContent({ children, className, align = 'bottom' }: DropdownContentProps) {
    const context = useContext(DropdownContext);
    if (!context) throw new Error('DropdownContent must be used within a Dropdown');

    if (!context.isOpen) return null;

    let alignClass = 'top-full mt-2';
    if (align === 'top') alignClass = 'bottom-full mb-2 right-0 left-0';

    return (
        <div
            className={cn(
                'absolute z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/95 p-1 shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200',
                alignClass,
                className
            )}
        >
            {children}
        </div>
    );
}

export function DropdownItem({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
    const context = useContext(DropdownContext);

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
                context?.close();
            }}
            className={cn(
                'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 outline-none transition-colors hover:bg-white/10 hover:text-white',
                className
            )}
        >
            {children}
        </div>
    );
}

export function DropdownSeparator({ className }: { className?: string }) {
    return <div className={cn('-mx-1 my-1 h-px bg-white/10', className)} />;
}
