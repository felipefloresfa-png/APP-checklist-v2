import React, { useState, useRef, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import { Category } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface CategorySelectorProps {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ selectedCategory, onCategoryChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = CATEGORIES.find(c => c.id === selectedCategory);
  const IconComponent = selectedOption?.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (category: Category) => {
    onCategoryChange(category);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-3">
          {IconComponent && <IconComponent className="w-5 h-5 text-slate-500" />}
          {selectedOption?.name || 'Seleccionar...'}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <ul
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
          tabIndex={-1}
          role="listbox"
          aria-activedescendant={selectedCategory}
        >
          {CATEGORIES.map(cat => (
            <li
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              className="text-slate-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-slate-100"
              role="option"
              aria-selected={cat.id === selectedCategory}
            >
              <div className="flex items-center gap-3">
                <cat.icon className="w-5 h-5 text-slate-500" />
                <span className={`font-normal block truncate ${cat.id === selectedCategory ? 'font-semibold' : ''}`}>
                  {cat.name}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CategorySelector;