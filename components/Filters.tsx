
import React from 'react';
import { CATEGORIES } from '../constants';
import { Category } from '../types';

interface FiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
}

const FilterButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  count: number;
  children?: React.ReactNode;
}> = ({ label, isActive, onClick, count, children }) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    }`}
  >
    {children}
    {label} ({count || 0})
  </button>
);

const Filters: React.FC<FiltersProps> = ({ activeFilter, onFilterChange, counts }) => {
  const staticFilters = ['Todos', 'Pendientes', 'Completados'];

  return (
    <div className="flex items-center gap-2 pb-4 overflow-x-auto">
      {staticFilters.map(filter => (
        <FilterButton
          key={filter}
          label={filter}
          isActive={activeFilter === filter}
          onClick={() => onFilterChange(filter)}
          count={counts[filter]}
        />
      ))}
      <div className="h-6 w-px bg-slate-200 mx-2"></div>
      {CATEGORIES.map(cat => (
        <FilterButton
          key={cat.id}
          label={cat.name}
          isActive={activeFilter === cat.id}
          onClick={() => onFilterChange(cat.id)}
          count={counts[cat.id]}
        >
          <cat.icon className="w-4 h-4" />
        </FilterButton>
      ))}
    </div>
  );
};

export default Filters;
