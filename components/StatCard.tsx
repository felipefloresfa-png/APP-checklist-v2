
import React from 'react';

interface StatCardProps {
  bgColor?: string;
  children: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ bgColor = 'bg-slate-100', children }) => {
  return (
    <div className={`p-4 rounded-xl ${bgColor}`}>
      {children}
    </div>
  );
};

export default StatCard;
