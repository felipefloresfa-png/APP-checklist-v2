import * as React from 'react';
import { Item } from '../types.js';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    item: Item | null;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, item }) => {
    if (!isOpen || !item) return null;

    const title = 'Confirmar Eliminación';
    const message = <>¿Estás seguro de que quieres eliminar <span className="font-bold text-gray-900">"{item.name}"</span>? Esta acción no se puede deshacer.</>;
    const confirmButtonText = 'Eliminar';
    const confirmButtonClasses = 'bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-500/20';
    const headerId = `confirmation-title-delete`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby={headerId}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center" onClick={e => e.stopPropagation()}>
                <h2 id={headerId} className="text-xl font-bold text-gray-900 mb-4">
                    {title}
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    {message}
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-base font-semibold text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2.5 text-base font-semibold text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg ${confirmButtonClasses}`}
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
