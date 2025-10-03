
import React from 'react';

const BedroomIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 11V5a2 2 0 00-2-2H6a2 2 0 00-2 2v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 17v-2a2 2 0 00-2-2H4a2 2 0 00-2 2v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 17h20" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 11V7" />
    </svg>
);

export default BedroomIcon;
