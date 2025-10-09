export const formatRelativeTime = (date: Date | null | undefined): string => {
    if (!date) return '';

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) {
        return 'hace unos segundos';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `hace ${minutes} min.`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `hace ${hours} h.`;
    }

    const days = Math.floor(hours / 24);
    if (days === 1) {
        return 'ayer';
    }
    if (days < 7) {
        return `hace ${days} días`;
    }
    
    const weeks = Math.floor(days/7);
    if (weeks < 4) {
      return `hace ${weeks} sem.`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
        return `hace ${months} meses`;
    }

    const years = Math.floor(days / 365);
    return `hace ${years} años`;
};