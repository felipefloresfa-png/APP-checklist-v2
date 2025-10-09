import * as React from 'react';
import { Item, Category, Relevance, User } from '../types';
import { CATEGORIES } from '../constants';
import { XIcon } from './icons';

interface EditItemModalProps {
    item: Item;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Omit<Item, 'id'>>) => Promise<void>;
}

const selectArrowStyle = {
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7281' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
  backgroundPosition: 'right 0.75rem center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '1.25em 1.25em',
};

const inputStyle = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-shadow shadow-sm appearance-none text-gray-900 placeholder:text-gray-400";
const labelStyle = "block text-sm font-medium text-gray-700 mb-1.5";


const EditItemModal: React.FC<EditItemModalProps> = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = React.useState<Partial<Item>>(item);
    const [formattedPrice, setFormattedPrice] = React.useState('');

    React.useEffect(() => {
        setFormData(item);
        setFormattedPrice(new Intl.NumberFormat('es-CL').format(item.price));
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        const numberValue = parseInt(value, 10) || 0;
        setFormData(prev => ({ ...prev, price: numberValue }));
        setFormattedPrice(value === '' ? '' : new Intl.NumberFormat('es-CL').format(numberValue));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const { id, ...updates } = formData;
        
        const finalUpdates = {
            ...updates,
            price: Number(updates.price) || 0,
            quantity: Number(updates.quantity) || 1,
            completedBy: updates.completedBy === '' ? null : updates.completedBy,
        };

        // Firestore doesn't allow undefined values, so we remove any properties that are undefined.
        Object.keys(finalUpdates).forEach(key => {
            const typedKey = key as keyof typeof finalUpdates;
            if (finalUpdates[typedKey] === undefined) {
                delete finalUpdates[typedKey];
            }
        });
        
        // Se realiza la operación de guardado en segundo plano (fire-and-forget)
        // y se cierra el modal inmediatamente para una experiencia de usuario fluida.
        onSave(item.id, finalUpdates).catch((error: any) => {
            console.error("Error saving item:", error.message || String(error));
            // Si falla, se notifica al usuario, aunque el modal ya esté cerrado.
            alert('Hubo un error al guardar los cambios. Por favor, revisa tu conexión e inténtalo de nuevo.');
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-item-title">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 sm:p-7 relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <h2 id="edit-item-title" className="text-xl font-bold text-gray-900">Editar Item</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Cerrar modal">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className={labelStyle}>
                            Nombre del Item *
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name || ''}
                            onChange={handleChange}
                            className={inputStyle}
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="category" className={labelStyle}>
                            Espacio / Categoría *
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category || ''}
                            onChange={handleChange}
                            className={inputStyle}
                            style={selectArrowStyle}
                            required
                        >
                             {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className={labelStyle}>
                                Precio (CLP) *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                <input
                                    id="price"
                                    name="price"
                                    type="text"
                                    value={formattedPrice}
                                    onChange={handlePriceChange}
                                    className={`${inputStyle} pl-6`}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="quantity" className={labelStyle}>
                                Cantidad *
                            </label>
                             <select
                                id="quantity"
                                name="quantity"
                                value={formData.quantity || 1}
                                onChange={handleChange}
                                className={inputStyle}
                                style={selectArrowStyle}
                                required
                            >
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className={`grid ${formData.completed ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                        <div>
                            <label htmlFor="relevance" className={labelStyle}>
                                Relevancia
                            </label>
                            <select
                                id="relevance"
                                name="relevance"
                                value={formData.relevance || ''}
                                onChange={handleChange}
                                className={inputStyle}
                                style={selectArrowStyle}
                            >
                                {Object.values(Relevance).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        {formData.completed && (
                            <div>
                                <label htmlFor="completedBy" className={labelStyle}>
                                    Completado por
                                </label>
                                <select
                                    id="completedBy"
                                    name="completedBy"
                                    value={formData.completedBy || User.FELIPE}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    style={selectArrowStyle}
                                >
                                    {Object.values(User).map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    <div className="pt-4">
                         <button 
                            type="submit" 
                            style={{ backgroundColor: '#4F46E5' }}
                            className="w-full text-white font-semibold py-3 px-4 rounded-lg transition-opacity duration-200 shadow-lg shadow-indigo-500/30 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditItemModal;