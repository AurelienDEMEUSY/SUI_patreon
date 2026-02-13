'use client';

import { motion } from 'framer-motion';

interface StaggerContainerProps {
    children: React.ReactNode;
    delay?: number;
    className?: string;
    staggerChildren?: number;
}

export function StaggerContainer({
    children,
    delay = 0,
    className = "",
    staggerChildren = 0.1
}: StaggerContainerProps) {
    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                delayChildren: delay,
                staggerChildren: staggerChildren
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={container}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    const item = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut" as const
            }
        }
    };

    return (
        <motion.div variants={item} className={className}>
            {children}
        </motion.div>
    );
}
