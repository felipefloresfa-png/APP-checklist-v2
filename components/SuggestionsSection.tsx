import React, { useState, useCallback } from 'react';
import { getSuggestions, SuggestedItemResponse } from '../services/geminiService';
import { Category, Relevance, SuggestedItem } from '../types';
import { CATEGORIES } from '../constants';
import SuggestionsIcon from './icons/SuggestionsIcon';
import Loader from './Loader';
import PlusIcon from './icons/PlusIcon';

interface SuggestionsSectionProps {
    onAddSuggested: (item: SuggestedItem) => void;
}

const SuggestionsSection: React.FC<SuggestionsSectionProps> = ({ onAddSuggested }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestedItemResponse[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category>(Category.LIVING);
    const [error, setError] = useState<string | null>(null);

    const handleGetSuggestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions([]);
        try {
            const result = await getSuggestions(selectedCategory);
            setSuggestions(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory]);

    const formattedPrice = (price: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(price);

    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-3">
                 <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value as Category)}
                    className="w-full sm:w-auto px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
                    disabled={isLoading}
                >
                    {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{`Sugerencias para ${cat.name}`}</option>)}
                </select>
                <button
                    onClick={handleGetSuggestions}
                    disabled={isLoading}
                    className="flex-grow flex items-center justify-center gap-2 w-full px-5 py-3 bg-amber-500 text-white font-semibold rounded-lg shadow-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition duration-200 disabled:bg-amber-300"
                >
                    {isLoading ? <Loader /> : <SuggestionsIcon className="w-5 h-5" />}
                    <span>Sugerencias de Items</span>
                </button>
            </div>
            
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

            {suggestions.length > 0 && (
                <div className="mt-6 space-y-3">
                    <h3 className="font-semibold text-slate-600">Sugerencias para {selectedCategory}:</h3>
                    {suggestions.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                            <div>
                                <p className="font-medium text-slate-800">{item.name}</p>
                                <p className="text-sm text-slate-500">{item.relevance} - {formattedPrice(item.price)}</p>
                            </div>
                            <button 
                                onClick={() => onAddSuggested({ ...item, category: selectedCategory })}
                                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-semibold p-2 rounded-lg hover:bg-indigo-100 transition-colors"
                                aria-label={`Agregar ${item.name}`}
                            >
                                <PlusIcon className="w-4 h-4"/>
                                Agregar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SuggestionsSection;