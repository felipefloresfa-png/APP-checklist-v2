import * as React from 'react';
import { Item, Category } from '../types.js';
import { CATEGORIES } from '../constants.js';
import { HouseIcon } from './icons.js';

interface ProgresoEspacioProps {
    items: Item[];
    onOpenCategoryModal: (category: Category) => void;
}

const ProgresoEspacio: React.FC<ProgresoEspacioProps> = ({ items, onOpenCategoryModal }) => {
    
    return (
        <section>
            <div className="flex items-center space-x-2 mb-4">
                <HouseIcon className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-bold text-gray-700">Progreso por Espacio</h3>
            </div>
            <div className="flex space-x-3 overflow-x-auto pb-4 -mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {CATEGORIES.map(category => {
                    const categoryItems = items.filter(item => item.category === category.id && !item.deleted);
                    if (categoryItems.length === 0) return null;

                    const total = categoryItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
                    const completed = categoryItems.reduce((sum, item) => sum + (item.completedQuantity || 0), 0);
                    const progress = total > 0 ? (completed / total) * 100 : 0;

                    return (
                        <div 
                            key={category.id} 
                            onClick={() => onOpenCategoryModal(category.id)}
                            className="flex-shrink-0 w-32 bg-white p-4 rounded-xl shadow-sm text-center cursor-pointer transition-shadow hover:shadow-lg flex flex-col"
                        >
                            <category.icon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <h4 className="font-semibold text-gray-700 text-sm truncate flex-grow">{category.name}</h4>
                            <div className="mt-auto">
                                <div className="w-full bg-gray-200 rounded-full h-1 my-2">
                                    <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-500">{completed}/{total} Unidades</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            <style>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    );
};

export default ProgresoEspacio;
