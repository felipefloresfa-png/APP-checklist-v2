import * as React from 'react';
import { Item, Category } from '../types.ts';
import { CATEGORIES } from '../constants.ts';
import { XIcon } from './icons.tsx';

const CategoryItemsModal: React.FC<{
    category: Category;
    items: Item[];
    onClose: () => void;
    onUpdateCompletion: (id: string, newCompletedQuantity: number) => void;
}> = ({ category, items, onClose, onUpdateCompletion }) => {
    const categoryInfo = CATEGORIES.find(c => c.id === category);

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-CL', { style: 'decimal' }).format(value);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="category-items-title">
            <style>
                {`
                .list-checkbox {
                    appearance: none;
                    -webkit-appearance: none;
                    min-width: 22px;
                    width: 22px;
                    height: 22px;
                    border: 1.5px solid #CFD8E3;
                    border-radius: 50%;
                    outline: none;
                    cursor: pointer;
                    transition: background-color 0.2s, border-color 0.2s;
                }
                .list-checkbox:checked {
                    background-color: #4338CA;
                    border-color: #4338CA;
                }
                `}
            </style>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 sm:p-8 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                    <XIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center space-x-3 mb-6">
                    {categoryInfo && <categoryInfo.icon className="h-8 w-8 text-gray-700" />}
                    <h2 id="category-items-title" className="text-xl font-bold text-gray-900">
                        Productos de {categoryInfo?.name}
                    </h2>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto -mr-3 pr-3">
                     {items.length > 0 ? items.map(item => {
                        const isCompleted = item.completedQuantity >= item.quantity;
                        return (
                            <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                 <div className="flex items-center space-x-4">
                                    <input
                                        type="checkbox"
                                        id={`modal-item-${item.id}`}
                                        className="list-checkbox"
                                        checked={isCompleted}
                                        onChange={(e) => onUpdateCompletion(item.id, e.target.checked ? item.quantity : 0)}
                                    />
                                    <label htmlFor={`modal-item-${item.id}`} className={`text-gray-700 cursor-pointer ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                                        {item.name}
                                    </label>
                                 </div>
                                <span className={`font-bold text-gray-800 flex-shrink-0 ml-4 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                                    ${formatCurrency(item.price * item.quantity)}
                                </span>
                            </div>
                        )
                    }) : (
                        <p className="text-gray-500 text-center py-8">No hay productos en esta categoría.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CategoryItemsModal;