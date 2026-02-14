export const format = {
    address: (address: string) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    mistToSui: (mist: number) => {
        return (mist / 1_000_000_000).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    },

    date: (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    },

    duration: (ms: number) => {
        const minutes = ms / 60_000;
        const hours = ms / 3_600_000;
        const days = ms / 86_400_000;
        if (days >= 365) return `${Math.round(days / 365)} year${Math.round(days / 365) > 1 ? 's' : ''}`;
        if (days >= 30) return `${Math.round(days / 30)} month${Math.round(days / 30) > 1 ? 's' : ''}`;
        if (days >= 7) return `${Math.round(days / 7)} week${Math.round(days / 7) > 1 ? 's' : ''}`;
        if (days >= 1) return `${Math.round(days)} day${Math.round(days) > 1 ? 's' : ''}`;
        if (hours >= 1) return `${Math.round(hours)} hour${Math.round(hours) > 1 ? 's' : ''}`;
        return `${Math.round(minutes)} min`;
    },
};
