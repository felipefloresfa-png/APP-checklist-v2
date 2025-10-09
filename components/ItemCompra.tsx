import * as React from 'react';
import { Item } from '../types.ts';
import { PencilIcon, TrashIcon, CheckIcon, EllipsisHorizontalIcon } from './icons.tsx';

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
    
