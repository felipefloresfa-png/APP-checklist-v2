import * as React from 'react';
import { Category, SuggestedItem } from '../types.js';
import { getSuggestions } from '../services/geminiService.js';
import Loader from './Loader.js';
import { SuggestionsIcon, XIcon, PlusIcon } from './icons.js';

const SuggestionsModal: React.FC<{
    category: Category;
    onClose: () => void;
    onAddItems: (items: SuggestedItem[]) => void;
}> = ({ category, onClose, onAddItems }) => {
    const [suggestions, setSuggestions] = React.useState<SuggestedItem[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [selected, setSelected] = React.useState<number[]>([]);

    React.useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await getSuggestions(category);
                setSuggestions(result.map(s => ({ ...s, category })));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, [category]);
    
    const handleToggleSelect = (index: number) => {
        setSelected(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleAddSelected = () => {
        const itemsToAdd = selected.map(i => suggestions[i]);
        onAddItems(itemsToAdd);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="suggestions-title">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Cerrar modal">
                    <XIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center space-x-3 mb-4">
                    <SuggestionsIcon className="h-8 w-8 text-slate-500" />
                    <div>
                        <h2 id="suggestions-title" className="text-xl font-bold text-gray-900">Sugerencias de IA</h2>
                        <p className="text-gray-500">Para la categoría: <strong>{category}</strong></p>
                    </div>
                </div>

                {loading && <div className="h-48 flex items-center justify-center"><Loader size="h-10 w-10"/></div>}
                {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg">{error}</div>}
                {!loading && !error && (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                        {suggestions.map((s, index) => (
                            <div key={index} onClick={() => handleToggleSelect(index)} className={`flex items-center p-3 rounded-lg cursor-pointer border-2 transition-all ${selected.includes(index) ? 'border-slate-500 bg-slate-50' : 'border-transparent bg-gray-100 hover:bg-gray-200'}`} role="checkbox" aria-checked={selected.includes(index)}>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{s.name}</p>
                                    <p className="text-sm text-gray-500">Relevancia: {s.relevance}</p>
                                </div>
                                <p className="font-bold text-gray-700">${new Intl.NumberFormat('es-CL').format(s.price)}</p>
                            </div>
                        ))}
                    </div>
                )}
                 <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button onClick={handleAddSelected} disabled={selected.length === 0} className="px-5 py-2 text-sm font-semibold text-white bg-slate-600 rounded-lg hover:bg-slate-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center">
                        <PlusIcon className="h-4 w-4 mr-1.5"/>
                        Agregar ({selected.length})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuggestionsModal;