import * as React from 'react';
import { Item, Relevance } from '../types.js';
import { PencilIcon, TrashIcon, CheckIcon, EllipsisHorizontalIcon } from './icons.js';
import { RELEVANCE_STYLES } from '../constants.js';

const ProgressCircle: React.FC<{ item: Item, onClick: () => void }> = ({ item, onClick }) => {
    const { completedQuantity, quantity } = item;

    const status: 'completed' | 'partial' | 'pending' = React.useMemo(() => {
        if (completedQuantity <= 0) return 'pending';
        if (completedQuantity >= quantity) return 'completed';
        return 'partial';
    }, [completedQuantity, quantity]);
    
    const progress = quantity > 0 ? completedQuantity / quantity : 0;
    const radius = 12;
    const circumference = 2 * Math.PI * (radius - 2); // Adjust for stroke width
    const offset = circumference * (1 - progress);

    const baseClasses = "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    const statusClasses = {
        pending: "bg-white border-2 border-gray-300 hover:bg-gray-100 focus:ring-indigo-400",
        partial: "bg-white border-2 border-indigo-500 focus:ring-indigo-400",
        completed: "bg-green-500 border-2 border-green-500 hover:bg-green-600 focus:ring-green-400"
    };

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${statusClasses[status]} relative`}
            aria-label={`Marcar progreso de ${item.name}. Estado actual: ${completedQuantity} de ${quantity}`}
        >
            {status === 'completed' && <CheckIcon className="h-5 w-5 text-white" />}
            
            {status === 'partial' && (
                <>
                    <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r={radius-2} fill="transparent" stroke="rgba(79, 70, 229, 0.2)" strokeWidth="2.5" />
                        <circle 
                            cx="12" 
                            cy="12" 
                            r={radius-2}
                            fill="transparent" 
                            stroke="#4F46E5"
                            strokeWidth="2.5" 
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                        />
                    </svg>
                    <span className="text-indigo-600 text-[10px] font-bold z-10">
                        {completedQuantity}/{quantity}
                    </span>
                </>
            )}
        </button>
    );
};


const ItemCompra: React.FC<{
    item: Item;
    onUpdateCompletion: (id: string, newCompletedQuantity: number) => void;
    onDelete: (id: string) => void;
    onStartEdit: (item: Item) => void;
}> = ({ item, onUpdateCompletion, onDelete, onStartEdit }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleProgressClick = () => {
        const { completedQuantity, quantity } = item;
        const newCompletedQuantity = completedQuantity >= quantity ? 0 : completedQuantity + 1;
        onUpdateCompletion(item.id, newCompletedQuantity);
    };

    const isCompleted = item.completedQuantity >= item.quantity;
    const relevanceStyle = RELEVANCE_STYLES[item.relevance];
    
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-CL', { style: 'decimal' }).format(value);
    };

    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm flex items-center space-x-4 transition-opacity duration-300 ${isCompleted ? 'opacity-60' : ''}`}>
            <ProgressCircle item={item} onClick={handleProgressClick} />

            <div className="flex-1 min-w-0">
                <p className={`font-semibold text-gray-800 truncate ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                    {item.name}
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1 flex-wrap gap-y-1">
                    <span>${formatCurrency(item.price * item.quantity)}</span>
                    <span className="text-gray-300">|</span>
                    <span>Cant: {item.quantity}</span>
                    <span className="text-gray-300">|</span>
                     <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${relevanceStyle.bg} ${relevanceStyle.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${relevanceStyle.dot}`}></span>
                        {item.relevance}
                    </span>
                </div>
            </div>

            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Opciones"
                >
                    <EllipsisHorizontalIcon className="h-5 w-5" />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl z-10 border border-gray-100">
                        <ul className="py-1">
                            <li>
                                <button
                                    onClick={() => {
                                        onStartEdit(item);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <PencilIcon className="h-4 w-4 mr-3" />
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => {
                                        onDelete(item.id);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <TrashIcon className="h-4 w-4 mr-3" />
                                    Eliminar
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ItemCompra;
