import * as React from 'react';
import { Item } from '../types.ts';
import ItemCompra from './ItemCompra.tsx';
import Loader from './Loader.tsx';

interface ListaComprasProps {
    items: Item[];
    loading: boolean;
    onUpdateCompletion: (id: string, newCompletedQuantity: number) => void;
    onDeleteItem: (id: string) => void;
    onStartEdit: (item: Item) => void;
}

const ListaCompras: React.FC<ListaComprasProps> = ({
    items,
    loading,
    onUpdateCompletion,
    onDeleteItem,
    onStartEdit,
}) => {
    if (loading) {
        return (
            <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                <Loader size="h-10 w-10" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {items.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <p className="text-gray-500">No hay artículos que coincidan con los filtros.</p>
                </div>
            )}
            {items.map(item => 
                <ItemCompra 
                    key={item.id} 
                    item={item} 
                    onUpdateCompletion={onUpdateCompletion} 
                    onDelete={onDeleteItem} 
                    onStartEdit={onStartEdit}
                />
            )}
        </div>
    );
};

export default ListaCompras;