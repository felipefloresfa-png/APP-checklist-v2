import React, { useState } from 'react';
import { Category, Relevance } from '../types';
import type { Item } from '../types';
import { CATEGORIES } from '../constants';
import PlusIcon from './icons/PlusIcon';
import CategorySelector from './CategorySelector';

interface AddItemFormProps {
  onAddItem: (item: Omit<Item, 'id' | 'completed'>) => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onAddItem }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>(Category.LIVING);
  const [relevance, setRelevance] = useState<Relevance>(Relevance.MEDIUM);
  const [price, setPrice] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && price.trim()) {
      onAddItem({
        name: name.trim(),
        category,
        relevance,
        price: Number(price),
      });
      setName('');
      setPrice('');
      setRelevance(Relevance.MEDIUM);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/[^\d]/g, '');
    setPrice(numericValue);
  };

  const formattedPrice = price ? new Intl.NumberFormat('es-CL').format(Number(price)) : '';

  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-700 mb-4">
        <PlusIcon className="w-5 h-5" />
        Agregar Item Manualmente
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="item-name" className="block text-sm font-medium text-slate-600 mb-1">Nombre del Item</label>
          <input
            id="item-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: 2 sillas, 1 mesa de centro..."
            className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 placeholder:text-slate-400"
            required
          />
        </div>
        <div>
          <label htmlFor="item-category" className="block text-sm font-medium text-slate-600 mb-1">Espacio / Categoría</label>
          <CategorySelector selectedCategory={category} onCategoryChange={setCategory} />
        </div>
        <div>
          <label htmlFor="item-relevance" className="block text-sm font-medium text-slate-600 mb-1">Relevancia</label>
          <select 
            id="item-relevance"
            value={relevance}
            onChange={(e) => setRelevance(e.target.value as Relevance)}
            className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
            >
            <option value={Relevance.HIGH}>♦ Alta</option>
            <option value={Relevance.MEDIUM}>♦ Media</option>
            <option value={Relevance.LOW}>♦ Baja</option>
          </select>
        </div>
         <div className="md:col-span-2">
           <label htmlFor="item-price" className="block text-sm font-medium text-slate-600 mb-1">Precio (CLP) *</label>
           <div className="relative">
             <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
               <span className="text-gray-500 sm:text-sm">$</span>
             </div>
             <input
              id="item-price"
              type="text"
              inputMode="numeric"
              value={formattedPrice}
              onChange={handlePriceChange}
              placeholder="80.000"
              className="w-full pl-7 pr-3 py-2 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 placeholder:text-slate-400"
              required
            />
           </div>
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full py-3 bg-violet-400 text-white font-semibold rounded-lg shadow-md hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition duration-200"
          >
            Agregar
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddItemForm;