import * as React from 'react';
import { Category, Relevance } from './types.ts';
import { 
    LivingIcon, 
    KitchenIcon, 
    DiningIcon, 
    BedroomIcon, 
    LaundryIcon, 
    BathroomIcon, 
    TerraceIcon, 
    OtherIcon 
} from './components/icons.tsx';

export const CATEGORIES: { id: Category; name: string; icon: React.FC<{className?: string}> }[] = [
    { id: Category.LIVING, name: 'Living', icon: LivingIcon },
    { id: Category.KITCHEN, name: 'Cocina', icon: KitchenIcon },
    { id: Category.DINING, name: 'Comedor', icon: DiningIcon },
    { id: Category.MAIN_BEDROOM, name: 'Dormitorio P.', icon: BedroomIcon },
    { id: Category.PIPE_BEDROOM, name: 'Dormitorio Pipe', icon: BedroomIcon },
    { id: Category.LAUNDRY, name: 'Lavandería', icon: LaundryIcon },
    { id: Category.BATHROOMS, name: 'Baños', icon: BathroomIcon },
    { id: Category.TERRACE_1, name: 'Terraza 1', icon: TerraceIcon },
    { id: Category.TERRACE_2, name: 'Terraza 2', icon: TerraceIcon },
    { id: Category.OTHER, name: 'Otro', icon: OtherIcon },
];

export const RELEVANCE_STYLES: Record<Relevance, { bg: string; text: string, dot: string }> = {
    [Relevance.HIGH]: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
    [Relevance.MEDIUM]: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    [Relevance.LOW]: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
};