import React from 'react';

const BathroomIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 19V9a2 2 0 00-2-2H7a2 2 0 00-2 2v10h14z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V6a1 1 0 011-1h1" />
  </svg>
);

export default BathroomIcon;