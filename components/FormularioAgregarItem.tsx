import React, { useState, useRef, useEffect } from 'react';
import { Item, Category, Relevance, User } from '../types';
import { CATEGORIES } from '../constants';
import { PlusCircleIcon } from './icons';

const selectArrowStyle = {
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7281' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
  backgroundPosition: 'right 0.75rem center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '1.25em 1.25em',
};

const inputStyle = "w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm";
const labelStyle = "block text-sm font-semibold text-gray-700 mb-1.5";

const AddItemForm: React.FC<{ 
    onAddItems: (items: Omit<Item, 'id' | 'completedQuantity'>[]) => void; 
    currentUser: User;
}> = ({ onAddItems, currentUser }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [relevance, setRelevance] = useState<Relevance>(Relevance.MEDIUM);
    
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleCategoryChange = (category: Category) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || selectedCategories.length === 0) {
            alert("Por favor, completa todos los campos obligatorios (*).");
            return;
        }

        const itemsToAdd = selectedCategories.map(category => ({
            name: name.trim(),
            category: category,
            relevance,
            price: 0,
            quantity: parseInt(quantity, 10) || 1,
            addedBy: currentUser,
        }));

        onAddItems(itemsToAdd);

        setName('');
        setQuantity('1');
        setSelectedCategories([]);
        setRelevance(Relevance.MEDIUM);
        setIsCategoryDropdownOpen(false);
    };

    const getCategoryButtonText = () => {
        if (selectedCategories.length === 0) return 'Seleccionar...';
        if (selectedCategories.length > 2) return `${selectedCategories.length} categorías seleccionadas`;
        return selectedCategories
            .map(id => CATEGORIES.find(c => c.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <style>{`
                .custom-checkbox {
                    appearance: none;
                    -webkit-appearance: none;
                    background-color: #fff;
                    border: 1.5px solid #9ca3af; /* gray-400 */
                    border-radius: 9999px; /* rounded-full */
                    width: 1.125rem; /* 18px */
                    height: 1.125rem; /* 18px */
                    position: relative;
                    cursor: pointer;
                    outline: none;
                    transition: background-color 0.2s, border-color 0.2s;
                    flex-shrink: 0;
                }
                .custom-checkbox:checked {
                    background-color: #4f46e5; /* violet-600 */
                    border-color: #4f46e5;
                }
                .custom-checkbox:checked::after {
                    content: '';
                    display: block;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 5px;
                    height: 10px;
                    border: solid white;
                    border-width: 0 2px 2px 0;
                    transform: translate(-50%, -60%) rotate(45deg);
                }
                .custom-checkbox:focus-visible {
                    box-shadow: 0 0 0 2px white, 0 0 0 4px #4f46e5;
                }
            `}</style>
            <div className="flex items-center space-x-2.5 mb-5">
                <PlusCircleIcon className="h-6 w-6 text-gray-500"/>
                <h3 className="text-lg font-bold text-gray-700">Agregar Item Manualmente</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="itemName" className={labelStyle}>
                        Nombre del Item *
                    </label>
                    <input
                        id="itemName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Jabonera, set de toallas..."
                        className={`${inputStyle} text-gray-900 placeholder:text-gray-400`}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="itemQuantity" className={labelStyle}>
                            Cantidad *
                        </label>
                        <select
                            id="itemQuantity"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className={`${inputStyle} text-gray-900 appearance-none`}
                            style={selectArrowStyle}
                            required
                        >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="itemRelevance" className={labelStyle}>
                            Relevancia
                        </label>
                        <select 
                            id="itemRelevance"
                            value={relevance} 
                            onChange={e => setRelevance(e.target.value as Relevance)} 
                            className={`${inputStyle} text-gray-900 appearance-none`}
                            style={selectArrowStyle}
                        >
                            {Object.values(Relevance).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className={labelStyle}>Espacio / Categoría *</label>
                     <div className="relative" ref={categoryDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            className={`${inputStyle} text-left flex justify-between items-center`}
                            aria-haspopup="listbox"
                            aria-expanded={isCategoryDropdownOpen}
                        >
                            <span className={`truncate ${selectedCategories.length > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                                {getCategoryButtonText()}
                            </span>
                            <svg className="h-5 w-5 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {isCategoryDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                                <ul className="py-1" role="listbox">
                                    {CATEGORIES.map(c => (
                                        <li
                                            key={c.id}
                                            className="px-3 py-2 text-sm text-gray-800 hover:bg-violet-50 cursor-pointer"
                                            onClick={() => handleCategoryChange(c.id)}
                                            role="option"
                                            aria-selected={selectedCategories.includes(c.id)}
                                        >
                                            <label className="flex items-center space-x-3 w-full cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    readOnly
                                                    checked={selectedCategories.includes(c.id)}
                                                    className="custom-checkbox"
                                                />
                                                <span className="font-medium select-none">{c.name}</span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>


                <button 
                    type="submit" 
                    className="w-full bg-violet-200 text-violet-800 font-semibold py-3 px-4 rounded-lg hover:bg-violet-300 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                >
                    Agregar
                </button>
            </form>
        </div>
    );
};

export default AddItemForm;