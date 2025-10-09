import * as React from 'react';
import { Item, Relevance } from '../types.ts';
import { RELEVANCE_STYLES } from '../constants.ts';
import { PencilIcon, XIcon, CheckIcon } from './icons.tsx';

const Dashboard: React.FC<{ 
    items: Item[]; 
    totalBudget: number; 
    onUpdateBudget: (newBudget: number) => void;
}> = ({ items, totalBudget, onUpdateBudget }) => {
    const [isEditingBudget, setIsEditingBudget] = React.useState(false);
    const [editedBudget, setEditedBudget] = React.useState('');

    React.useEffect(() => {
        setEditedBudget(new Intl.NumberFormat('es-CL').format(totalBudget));
    }, [totalBudget]);

    const { completedUnits, totalUnits, completedCost } = React.useMemo(() => {
        let totalUnits = 0;
        let completedUnits = 0;
        let completedCost = 0;

        for (const item of items) {
            if (item.deleted) continue;
            totalUnits += item.quantity || 1;
            completedUnits += item.completedQuantity || 0;
            completedCost += item.price * (item.completedQuantity || 0);
        }
        
        return { totalUnits, completedUnits, completedCost };
    }, [items]);

    const progress = totalUnits > 0 ? (completedUnits / totalUnits) : 0;

    const relevanceStats = React.useMemo(() => {
        const initialStats: Record<Relevance, { total: number, completed: number }> = {
            [Relevance.HIGH]: { total: 0, completed: 0 },
            [Relevance.MEDIUM]: { total: 0, completed: 0 },
            [Relevance.LOW]: { total: 0, completed: 0 },
        };
        return items.reduce((acc, item) => {
            if (item.deleted) return acc;
            if (acc[item.relevance]) {
                acc[item.relevance].total += item.quantity || 1;
                acc[item.relevance].completed += item.completedQuantity || 0;
            }
            return acc;
        }, initialStats);
    }, [items]);

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-CL', { style: 'decimal', currency: 'CLP' }).format(value);
    };

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setEditedBudget(value === '' ? '' : new Intl.NumberFormat('es-CL').format(Number(value)));
    };

    const handleSaveBudget = () => {
        const newBudget = parseInt(editedBudget.replace(/\./g, ''), 10);
        if (!isNaN(newBudget) && newBudget !== totalBudget) {
            onUpdateBudget(newBudget);
        }
        setIsEditingBudget(false);
    };

    const handleCancelBudget = () => {
        setEditedBudget(new Intl.NumberFormat('es-CL').format(totalBudget));
        setIsEditingBudget(false);
    };
    
    const radius = 50;
    const circumference = Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <section className="space-y-6">
            {/* Progreso General */}
            <div className="bg-white p-6 rounded-2xl shadow-md text-center">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Progreso General</h3>
                <div className="relative w-48 h-24 mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 120 60">
                        <path
                            d="M 10 55 A 50 50 0 0 1 110 55"
                            fill="none"
                            stroke="#F3F4F6"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                        <path
                            d="M 10 55 A 50 50 0 0 1 110 55"
                            fill="none"
                            stroke="#4F46E5"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center mt-2">
                        <span className="text-3xl font-bold text-gray-800">{completedUnits}/{totalUnits}</span>
                    </div>
                </div>
            </div>

            {/* Presupuesto */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-700">Presupuesto</h3>
                    {!isEditingBudget && (
                        <button onClick={() => setIsEditingBudget(true)} className="text-gray-400 hover:text-indigo-600 p-1 rounded-full" aria-label="Editar presupuesto">
                            <PencilIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
                {isEditingBudget ? (
                     <div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                type="text"
                                value={editedBudget}
                                onChange={handleBudgetChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveBudget();
                                    if (e.key === 'Escape') handleCancelBudget();
                                }}
                                className="w-full pl-7 pr-2 py-1 text-2xl font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center justify-end mt-2 space-x-1">
                           <button onClick={handleSaveBudget} className="text-green-600 hover:text-green-800 p-2 rounded-full" aria-label="Guardar">
                               <CheckIcon className="h-5 w-5" />
                           </button>
                           <button onClick={handleCancelBudget} className="text-gray-500 hover:text-gray-700 p-2 rounded-full" aria-label="Cancelar">
                               <XIcon className="h-5 w-5" />
                           </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-3xl font-bold text-gray-800">${formatCurrency(completedCost)}</span>
                            <span className="text-2xl font-semibold text-gray-500">/ ${formatCurrency(totalBudget)}</span>
                        </div>
                        <p className="text-sm font-medium text-green-600 mt-1">Resta: ${formatCurrency(totalBudget - completedCost)}</p>
                         <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${totalBudget > 0 ? (completedCost / totalBudget) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Relevancia */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Relevancia</h3>
                <div className="space-y-4">
                    {Object.values(Relevance).map(relevance => {
                        const stats = relevanceStats[relevance];
                        const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                        const colors = {
                            [Relevance.HIGH]: { label: 'text-red-700', track: 'bg-red-100', fill: 'bg-red-500' },
                            [Relevance.MEDIUM]: { label: 'text-yellow-700', track: 'bg-yellow-100', fill: 'bg-yellow-500' },
                            [Relevance.LOW]: { label: 'text-blue-700', track: 'bg-blue-100', fill: 'bg-blue-500' }
                        };
                        const currentColors = colors[relevance];

                        return (
                            <div key={relevance}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className={`font-semibold ${currentColors.label}`}>{relevance}</span>
                                    <span className="font-mono text-sm text-gray-600">{stats.completed}/{stats.total}</span>
                                </div>
                                <div className={`w-full ${currentColors.track} rounded-full h-2`}>
                                    <div 
                                        className={`${currentColors.fill} h-2 rounded-full`} 
                                        style={{ 
                                            width: `${progress}%`,
                                            transition: 'width 0.5s ease-in-out'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
};

export default Dashboard;