import * as React from 'react';
import { Item } from '../types';
import { PencilIcon, TrashIcon, CheckIcon, EllipsisHorizontalIcon } from './icons';

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
        const nextCompletedQuantity = (item.completedQuantity + 1) % (item.quantity + 1);
        onUpdateCompletion(item.id, nextCompletedQuantity);
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-CL', { style: 'decimal', currency: 'CLP' }).format(value);
    };

    const isFullyCompleted = item.completedQuantity >= item.quantity;
    const displayUser = isFullyCompleted ? item.completedBy : item.addedBy;

    const textClasses = isFullyCompleted ? 'text-gray-400 line-through' : 'text-gray-800';

    return (
        <div className={`bg-white rounded-xl shadow-sm p-4 transition-all duration-200 hover:shadow-md ${isFullyCompleted ? 'bg-gray-50' : ''}`}>
            <div className="flex justify-between items-start gap-3">
                {/* Left side: Progress Circle and Name */}
                <div className="flex items-start gap-3 flex-grow min-w-0">
                    <ProgressCircle item={item} onClick={handleProgressClick} />
                    <div>
                        <p className={`text-lg font-bold leading-tight ${textClasses}`}>
                            {item.name}
                        </p>
                        <div className="flex items-baseline space-x-2 mt-0.5">
                            <p className={`text-xs font-semibold tracking-wider rounded-full px-2 py-0.5 ${isFullyCompleted ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-600'}`}>
                                {item.category}
                            </p>
                            {item.quantity > 1 && (
                                <p className={`text-sm font-medium ${isFullyCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                                     &bull; Cantidad: {item.quantity}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Right side: Menu */}
                <div className="relative flex-shrink-0" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                    >
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                    </button>
                    
                    {isMenuOpen && (
                        <div 
                           className="absolute top-full right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 z-10"
                           role="menu"
                        >
                           <ul className="py-1">
                                <li>
                                    <button 
                                        onClick={() => { onStartEdit(item); setIsMenuOpen(false); }}
                                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                        <span>Editar</span>
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => { onDelete(item.id); setIsMenuOpen(false); }}
                                        className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        role="menuitem"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        <span>Borrar</span>
                                    </button>
                                </li>
                           </ul>
                        </div>
                    )}
                </div>
            </div>
            
            {(item.relevance || displayUser || item.price > 0) && (
              <>
                <hr className="my-3 border-gray-100" />
                
                <div className="flex justify-between items-end flex-wrap gap-2">
                    {/* Tags */}
                    <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-sm text-gray-600 font-medium">
                         <span>{item.relevance}</span>

                         {isFullyCompleted && displayUser && (
                            <span>{displayUser}</span>
                         )}
                    </div>
                    
                    {/* Price */}
                     {item.price > 0 && (
                         <div className={`text-right ${isFullyCompleted ? 'opacity-60' : ''}`}>
                            <p className="text-base font-bold text-gray-800">
                                ${formatCurrency(item.price * item.quantity)}
                            </p>
                             {item.quantity > 1 && (
                                 <p className="text-xs text-gray-500">
                                     ${formatCurrency(item.price)} c/u
                                 </p>
                             )}
                         </div>
                     )}
                </div>
              </>
            )}
        </div>
    );
};

export default ItemCompra;