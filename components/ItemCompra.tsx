
import React from 'react';
import type { Item } from '../types';
import { CATEGORIES, RELEVANCE_STYLES } from '../constants';
import TrashIcon from './icons/BasuraIcono';

interface ItemProps {
  item: Item;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const Item: React.FC<ItemProps> = ({ item, onToggle, onDelete }) => {
  const categoryInfo = CATEGORIES.find(c => c.id === item.category);
  const relevanceInfo = RELEVANCE_STYLES[item.relevance];
  const formattedPrice = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(item.price);

  return (
    <div className={`flex items-center justify-between bg-slate-50 p-3 rounded-lg transition-all duration-300 ${item.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-4 flex-grow">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={() => onToggle(item.id)}
          className="h-6 w-6 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
        <div className="flex-grow">
          <p className={`font-medium ${item.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
            {item.name}
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
            <div className="flex items-center gap-1">
                {categoryInfo && <categoryInfo.icon className="w-4 h-4" />}
                <span>{item.category}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${relevanceInfo.dot}`}></span>
                <span>{item.relevance}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <p className={`font-semibold text-slate-700 ${item.completed ? 'line-through' : ''}`}>{formattedPrice}</p>
        <button
          onClick={() => onDelete(item.id)}
          className="text-slate-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full"
          aria-label={`Eliminar ${item.name}`}
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Item;
