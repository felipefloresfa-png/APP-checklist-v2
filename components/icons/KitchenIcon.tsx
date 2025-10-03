
import React from 'react';

const KitchenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-1.5 8-5V7c0-1.5-1.5-3-3-3h-1.5a1.5 1.5 0 00-3 0H8c-1.5 0-3 1.5-3 3v10c0 3.5 8 5 8 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14a3 3 0 013-3h0a3 3 0 013 3v2H9v-2z" />
    </svg>
);

export default KitchenIcon;
