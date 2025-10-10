import * as React from 'react';
import { Item } from '../types.ts';
import { ShareIcon } from './icons.tsx';

interface ShareButtonProps {
    items: Item[];
}

const ShareButton: React.FC<ShareButtonProps> = ({ items }) => {
    const [copied, setCopied] = React.useState(false);

    const handleShare = () => {
        const pendingItems = items.filter(item => !item.deleted && item.completedQuantity < item.quantity);
        
        if (pendingItems.length === 0) {
            navigator.clipboard.writeText("¡Todos los artículos de la lista de compras están completados! 🎉");
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            return;
        }

        const groupedByCategory = pendingItems.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, Item[]>);

        let shareText = '🛒 Lista de Compras Pendiente:\n\n';

        for (const category in groupedByCategory) {
            const categoryItems = groupedByCategory[category];
            const totalPending = categoryItems.reduce((sum, item) => sum + (item.quantity - item.completedQuantity), 0);
            shareText += `**${category} (${totalPending}):**\n`;
            categoryItems.forEach(item => {
                const pending = item.quantity - item.completedQuantity;
                if (pending > 0) {
                     shareText += `- ${item.name} (${pending})\n`;
                }
            });
            shareText += '\n';
        }

        navigator.clipboard.writeText(shareText.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="pt-2 border-t border-gray-100">
            <div className="relative flex justify-center">
                <button
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
                >
                    <ShareIcon className="h-4 w-4" />
                    Compartir Lista
                </button>
                {copied && (
                     <div className="absolute -top-9 bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg transition-opacity duration-300">
                        ¡Copiado!
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShareButton;