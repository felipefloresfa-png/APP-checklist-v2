
import React from 'react';
import type { Item as ItemType } from '../types';
import Item from './ItemCompra';
import OtherIcon from './icons/OtherIcon';

interface ItemListProps {
  items: ItemType[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const ItemList: React.FC<ItemListProps> = ({ items, onToggle, onDelete }) => {
  if (items.length === 0) {
    return (
        <div className="text-center py-12">
            <div className="inline-block bg-slate-100 p-4 rounded-full mb-4">
                <OtherIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700">No hay items aquí</h3>
            <p className="text-slate-500 mt-2">
                Agrega un item o cambia el filtro para ver tus productos.
            </p>
        </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {items.map((item) => (
        <Item
          key={item.id}
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ItemList;
