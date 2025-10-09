import * as React from 'react';
import { Item, Category, Relevance } from '../types.ts';
import { CATEGORIES } from '../constants.ts';
import { SearchIcon, HouseIcon } from './icons.tsx';

interface FiltersProps {
    items: Item[];
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    filterCategory: Category | 'all';
    setFilterCategory: (value: Category | 'all') => void;
    filterRelevance: Relevance | 'all';
    setFilterRelevance: (value: Relevance | 'all') => void;
    filterStatus: 'all' | 'pending' | 'completed';
    setFilterStatus: (value: 'all' | 'pending' | 'completed') => void;
}

const Filters: React.FC<FiltersProps> = ({
    items,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterRelevance,
    setFilterRelevance,
    filterStatus,
    setFilterStatus,
}) => {
    const categoryCounts = React.useMemo(() => {
        const counts: { [key in Category | 'all']?: number } = { all: items.length };
        CATEGORIES.forEach(category => {
            counts[category.id] = items.filter(item => item.category === category.id).length;
        });
        return counts;
    }, [items]);

    const statusFilters: { id: 'all' | 'pending' | 'completed'; label: string }[] = [
        { id: 'all', label: 'Ver Todos' },
        { id: 'pending', label: 'Pendientes' },
        { id: 'completed', label: 'Completados' },
    ];

    const relevanceFilters: { id: Relevance; label: string }[] = [
        { id: Relevance.HIGH, label: 'Alta' },
        { id: Relevance.MEDIUM, label: 'Media' },
        { id: Relevance.LOW, label: 'Baja' },
    ];
    
    const allCategories = [{ id: 'all' as 'all', name: 'Todos', icon: HouseIcon }, ...CATEGORIES];

    return (
        <div className="bg-white p-4 rounded-xl shadow-md space-y-4">
            {/* Category Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 overflow-x-auto pb-1" aria-label="Tabs">
                    {allCategories.map(cat => {
                        const count = categoryCounts[cat.id as Category | 'all'] || 0;
                        const isActive = filterCategory === cat.id;
                        const Icon = cat.icon;

                        return (
                            <button
                                key={cat.id}
                                onClick={() => setFilterCategory(cat.id as Category | 'all')}
                                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm flex items-center space-x-2 focus:outline-none transition-colors duration-200
                                    ${isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`
                                }
                            >
                                <Icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                                <span>{cat.name}</span>
                                {/* FIX: Corrected an invalid ternary operator in the className which had an extra ':' causing a syntax error. */}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                     <style>{`
                        nav::-webkit-scrollbar {
                            display: none;
                        }
                        nav {
                           -ms-overflow-style: none;
                           scrollbar-width: none;
                        }
                    `}</style>
                </nav>
            </div>
            
            {/* Status and Relevance Pills */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {statusFilters.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setFilterStatus(filter.id)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400
                                ${filterStatus === filter.id
                                    ? 'bg-blue-600 text-white shadow'
                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`
                            }
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
                 <div className="flex items-center gap-2 flex-wrap">
                     {relevanceFilters.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setFilterRelevance(filterRelevance === filter.id ? 'all' : filter.id)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400
                                ${filterRelevance === filter.id
                                    ? 'bg-gray-600 text-white shadow'
                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`
                            }
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="pt-2">
                <div className="relative w-full">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                    />
                </div>
            </div>
        </div>
    );
};

export default Filters;