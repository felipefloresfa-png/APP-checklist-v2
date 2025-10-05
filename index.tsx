import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
// FIX: Aligned Firebase imports to use the modern 'firebase/*' syntax (v9+) for consistency and to resolve SDK version conflicts causing connection issues.
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    query, 
    orderBy, 
    doc, 
    setDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    writeBatch,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';


// =================================================================================
// --- FROM types.ts ---
// =================================================================================
export enum User {
  FELIPE = 'Felipe',
  VALERIA = 'Valeria',
}

export enum Relevance {
  HIGH = 'Alta',
  MEDIUM = 'Media',
  LOW = 'Baja',
}

export enum Category {
  LIVING = 'Living',
  KITCHEN = 'Cocina',
  DINING = 'Comedor',
  MAIN_BEDROOM = 'Dormitorio Principal',
  PIPE_BEDROOM = 'Dormitorio Pipe',
  LAUNDRY = 'Lavandería',
  BATHROOMS = 'Baños',
  TERRACE_1 = 'Terraza 1',
  TERRACE_2 = 'Terraza 2',
  OTHER = 'Otro',
}

export interface Item {
  id: string;
  name: string;
  category: Category;
  relevance: Relevance;
  price: number;
  quantity: number;
  completed: boolean;
  completedBy?: User | null;
  createdAt?: Date | null; // Always a Date or null in the app state.
  completedAt?: Date | null; // Always a Date or null in the app state.
  addedBy?: User;
  deleted?: boolean;
  deletedBy?: User | null;
  deletedAt?: Date | null;
}

export interface SuggestedItem {
  name: string;
  relevance: Relevance;
  price: number;
  category: Category;
}

// =================================================================================
// --- ICONS ---
// =================================================================================
const BathroomIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 19V9a2 2 0 00-2-2H7a2 2 0 00-2 2v10h14z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V6a1 1 0 011-1h1" />
  </svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const BedroomIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 11V5a2 2 0 00-2-2H6a2 2 0 00-2 2v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 17v-2a2 2 0 00-2-2H4a2 2 0 00-2 2v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 17h20" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 11V7" />
    </svg>
);
const DiningIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v18" />
    </svg>
);
const HouseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const KitchenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-1.5 8-5V7c0-1.5-1.5-3-3-3h-1.5a1.5 1.5 0 00-3 0H8c-1.5 0-3 1.5-3 3v10c0 3.5 8 5 8 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14a3 3 0 013-3h0a3 3 0 013 3v2H9v-2z" />
    </svg>
);
const LaundryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a2 2 0 012-2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2V4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a4 4 0 100-8 4 4 0 000 8z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 5h-2" />
  </svg>
);
const LivingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 10H7a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2v-2a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 10V8a2 2 0 012-2h6a2 2 0 012 2v2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2" />
  </svg>
);
const OtherIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);
const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
    </svg>
);
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);
const SuggestionsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);
const TerraceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13a4 4 0 114 4h-8a4 4 0 114-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 16h6" />
    </svg>
);
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


// =================================================================================
// --- FROM constants.ts ---
// =================================================================================
const CATEGORIES: { id: Category; name: string; icon: React.FC<{className?: string}> }[] = [
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

const RELEVANCE_STYLES: Record<Relevance, { bg: string; text: string, dot: string }> = {
    [Relevance.HIGH]: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
    [Relevance.MEDIUM]: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    [Relevance.LOW]: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
};

// =================================================================================
// --- FROM initialData.ts ---
// =================================================================================
const initialItems: Omit<Item, 'id' | 'completed' | 'completedBy' | 'createdAt' | 'completedAt'>[] = [
  // LAVANDERIA
  { name: 'Lavadora secadora', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 450000, quantity: 1 },
  { name: 'Repisa para detergentes', category: Category.LAUNDRY, relevance: Relevance.LOW, price: 25000, quantity: 1 },
  { name: 'Colgador plegable', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 30000, quantity: 1 },
  { name: 'Plancha', category: Category.LAUNDRY, relevance: Relevance.MEDIUM, price: 20000, quantity: 1 },
  { name: 'Tabla de Planchar', category: Category.LAUNDRY, relevance: Relevance.LOW, price: 25000, quantity: 1 },
  { name: 'Ganchos para ropa', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 10000, quantity: 1 },
  { name: 'Canasto ropa sucia', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 15000, quantity: 1 },
  { name: 'Canasto ropa limpia', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 15000, quantity: 1 },
  { name: 'Cortina Roller', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 40000, quantity: 1 },
  // COCINA
  { name: 'Refrigerador', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 500000, quantity: 1 },
  { name: 'Microondas', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 70000, quantity: 1 },
  { name: 'Hervidor electrico', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 20000, quantity: 1 },
  { name: 'Juego de Ollas', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 80000, quantity: 1 },
  { name: 'Sarten grande', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 25000, quantity: 1 },
  { name: 'Sarten pequeno', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 15000, quantity: 1 },
  { name: 'Fuente de vidrio (budinera)', category: Category.KITCHEN, relevance: Relevance.LOW, price: 12000, quantity: 1 },
  { name: 'Vajilla (12p)', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 60000, quantity: 1 },
  { name: 'Vasos (x6)', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 15000, quantity: 1 },
  { name: 'Jarro para jugo', category: Category.KITCHEN, relevance: Relevance.LOW, price: 8000, quantity: 1 },
  { name: 'Tazas (x6)', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 18000, quantity: 1 },
  { name: 'Juego de Cubiertos', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 30000, quantity: 1 },
  { name: 'Colador', category: Category.KITCHEN, relevance: Relevance.LOW, price: 5000, quantity: 1 },
  { name: 'Paños de cocina', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 7000, quantity: 1 },
  { name: 'Abre latas', category: Category.KITCHEN, relevance: Relevance.LOW, price: 4000, quantity: 1 },
  { name: 'Set de Cuchillos', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 35000, quantity: 1 },
  { name: 'Freidora de aire', category: Category.KITCHEN, relevance: Relevance.LOW, price: 60000, quantity: 1 },
  { name: 'Tostador de pan', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 20000, quantity: 1 },
  { name: 'Escobillon y Pala', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 10000, quantity: 1 },
  { name: 'Trapeador', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 12000, quantity: 1 },
  { name: 'Cafetera', category: Category.KITCHEN, relevance: Relevance.LOW, price: 50000, quantity: 1 },
  { name: 'Secador de loza', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 15000, quantity: 1 },
  { name: '3 sillas altas de cocina americana', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 90000, quantity: 1 },
  { name: 'Dispensador de lavaloza', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 8000, quantity: 1 },
  { name: 'Dispensador de jabon', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 8000, quantity: 1 },
  { name: 'Porta Esponja', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 5000, quantity: 1 },
  { name: 'Porta servilleta', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 6000, quantity: 1 },
  { name: 'Porta Toalla absorbente', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 10000, quantity: 1 },
  { name: 'Licuadora', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 45000, quantity: 1 },
  { name: 'Set de Tupperware', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 20000, quantity: 1 },
  { name: 'Tabla para picar (x2)', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 12000, quantity: 1 },
  // LIVING
  { name: 'Sofa en L', category: Category.LIVING, relevance: Relevance.MEDIUM, price: 600000, quantity: 1 },
  { name: '2 Sillones individuales', category: Category.LIVING, relevance: Relevance.LOW, price: 250000, quantity: 1 },
  { name: 'Mesa de Centro', category: Category.LIVING, relevance: Relevance.LOW, price: 80000, quantity: 1 },
  { name: 'TV 55"', category: Category.LIVING, relevance: Relevance.MEDIUM, price: 350000, quantity: 1 },
  { name: 'Mueble para TV', category: Category.LIVING, relevance: Relevance.MEDIUM, price: 120000, quantity: 1 },
  { name: 'Alfombra', category: Category.LIVING, relevance: Relevance.MEDIUM, price: 90000, quantity: 1 },
  { name: 'Mesa Lateral', category: Category.LIVING, relevance: Relevance.LOW, price: 40000, quantity: 1 },
  { name: 'Cojines Decorativos (x4)', category: Category.LIVING, relevance: Relevance.LOW, price: 30000, quantity: 1 },
  { name: 'Manta para Sofá', category: Category.LIVING, relevance: Relevance.LOW, price: 25000, quantity: 1 },
  // COMEDOR
  { name: 'Comedor 6 sillas', category: Category.DINING, relevance: Relevance.MEDIUM, price: 300000, quantity: 1 },
  { name: 'Florero', category: Category.DINING, relevance: Relevance.LOW, price: 15000, quantity: 1 },
  { name: 'Camino de mesa', category: Category.DINING, relevance: Relevance.LOW, price: 12000, quantity: 1 },
  { name: 'Individuales para mesa (x6)', category: Category.DINING, relevance: Relevance.LOW, price: 18000, quantity: 1 },
  // DORMITORIO PIPE
  { name: 'Cama 1.5 plazas', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 200000, quantity: 1 },
  { name: '2 juegos de sabanas 1.5p', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 50000, quantity: 1 },
  { name: '2 cubrecamas 1.5p', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 70000, quantity: 1 },
  { name: 'Basurero', category: Category.PIPE_BEDROOM, relevance: Relevance.LOW, price: 8000, quantity: 1 },
  { name: 'Escritorio', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 90000, quantity: 1 },
  { name: 'Silla de escritorio', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 60000, quantity: 1 },
  { name: 'Cortina', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 45000, quantity: 1 },
  { name: 'Lampara de escritorio', category: Category.PIPE_BEDROOM, relevance: Relevance.MEDIUM, price: 20000, quantity: 1 },
  { name: 'Velador', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 40000, quantity: 1 },
  // DORMITORIO PRINCIPAL
  { name: 'Cama 2 plazas', category: Category.MAIN_BEDROOM, relevance: Relevance.HIGH, price: 350000, quantity: 1 },
  { name: '2 juegos de sabanas 2p', category: Category.MAIN_BEDROOM, relevance: Relevance.HIGH, price: 70000, quantity: 1 },
  { name: 'Cubrecama 2p', category: Category.MAIN_BEDROOM, relevance: Relevance.HIGH, price: 50000, quantity: 1 },
  { name: 'Almohadas (x2)', category: Category.MAIN_BEDROOM, relevance: Relevance.HIGH, price: 30000, quantity: 1 },
  { name: 'Velador (x2)', category: Category.MAIN_BEDROOM, relevance: Relevance.MEDIUM, price: 80000, quantity: 1 },
  { name: 'Lampara de velador (x2)', category: Category.MAIN_BEDROOM, relevance: Relevance.MEDIUM, price: 40000, quantity: 1 },
  { name: 'Cortinas Roller duo', category: Category.MAIN_BEDROOM, relevance: Relevance.HIGH, price: 80000, quantity: 1 },
  { name: 'Cómoda / Cajonera', category: Category.MAIN_BEDROOM, relevance: Relevance.MEDIUM, price: 120000, quantity: 1 },
  // BAÑOS
  { name: 'Toallas de corpo (x4)', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 40000, quantity: 1 },
  { name: 'Toallas de mano (x4)', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 20000, quantity: 1 },
  { name: 'Set dispensadores (jabon, shampoo, acond.)', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 25000, quantity: 1 },
  { name: 'Set de baño (escobilla, basurero)', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 30000, quantity: 1 },
  { name: 'Porta Toallas', category: Category.BATHROOMS, relevance: Relevance.MEDIUM, price: 20000, quantity: 1 },
  { name: 'Salida de ducha', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 15000, quantity: 1 },
  { name: 'Antideslizante ducha', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 10000, quantity: 1 },
  { name: 'Cortina de baño y forro', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 20000, quantity: 1 },
  { name: 'Sopapo', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 5000, quantity: 1 },
  // OTROS
  { name: 'Aspiradora', category: Category.OTHER, relevance: Relevance.MEDIUM, price: 100000, quantity: 1 },
  { name: 'Set de ampolletas LED', category: Category.OTHER, relevance: Relevance.HIGH, price: 25000, quantity: 1 },
  { name: 'Arrimo para entrada', category: Category.OTHER, relevance: Relevance.LOW, price: 70000, quantity: 1 },
  { name: 'Espejo cuerpo completo', category: Category.OTHER, relevance: Relevance.LOW, price: 50000, quantity: 1 },
  { name: 'Set de herramientas básico', category: Category.OTHER, relevance: Relevance.MEDIUM, price: 30000, quantity: 1 },
  { name: 'Alargador / Zapatilla eléctrica (x3)', category: Category.OTHER, relevance: Relevance.HIGH, price: 15000, quantity: 1 },
  // TERRAZA 1
  { name: 'Barra con 2 pisos', category: Category.TERRACE_1, relevance: Relevance.LOW, price: 120000, quantity: 1 },
  // TERRAZA 2
  { name: 'Juego de terraza (2 sillas y mesa)', category: Category.TERRACE_2, relevance: Relevance.LOW, price: 150000, quantity: 1 },
  { name: 'Planta decorativa', category: Category.TERRACE_2, relevance: Relevance.LOW, price: 30000, quantity: 1 },
];

// =================================================================================
// --- SERVICES ---
// =================================================================================

// Firebase Service
const firebaseConfig = {
  apiKey: "AIzaSyBFkVTdWYrN4lxDLRLJalUSBpxoONqdYk0",
  authDomain: "checklist-departamento.firebaseapp.com",
  projectId: "checklist-departamento",
  storageBucket: "checklist-departamento.firebasestorage.app",
  messagingSenderId: "615469691845",
  appId: "1:615469691845:web:27c56ecd5d0a3df3b851ac"
};
// FIX: Initialize Firebase using the imported `initializeApp` function.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Gemini Service
// FIX: Removed unnecessary 'as string' type assertion for the API key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SuggestedItemResponse {
  name: string;
  relevance: Relevance;
  price: number;
}

const getSuggestions = async (category: Category): Promise<SuggestedItemResponse[]> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Eres un asistente experto en decoración de interiores para una pareja joven amoblando su primera casa en Chile.
    Tu tarea es sugerir una lista de 3 ítems esenciales para la siguiente categoría: "${category}".
    Para cada ítem, proporciona:
    1. Un nombre descriptivo y atractivo (ej: "Sofá Modular Cómodo", "Mesa de Centro Rústica").
    2. Una relevancia ('Alta', 'Media', 'Baja') basada en qué tan esencial es el ítem para la funcionalidad y comodidad del espacio. 'Alta' para lo indispensable.
    3. Un precio estimado y realista en Pesos Chilenos (CLP), como un número entero, sin comas, puntos ni símbolo de moneda.

    Tu salida DEBE ser un array JSON válido de objetos. No incluyas texto o explicaciones adicionales, solo el JSON.
  `;

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Nombre del item sugerido." },
        // FIX: Removed unsupported 'enum' property from the response schema and improved description.
        relevance: { type: Type.STRING, description: "Relevancia del item (posibles valores: 'Alta', 'Media', 'Baja')." },
        price: { type: Type.INTEGER, description: "Precio estimado en CLP." },
      },
      required: ["name", "relevance", "price"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (Array.isArray(result)) {
      return result as SuggestedItemResponse[];
    }
    return [];
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("No se pudieron obtener sugerencias de la IA.");
  }
};

// =================================================================================
// --- UI COMPONENTS ---
// =================================================================================
const selectArrowStyle = {
  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7281' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
  backgroundPosition: 'right 0.75rem center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '1.25em 1.25em',
};

const Loader: React.FC<{ size?: string }> = ({ size = 'h-5 w-5' }) => {
  return (
    <div role="status" className="flex justify-center items-center">
      <svg
        aria-hidden="true"
        className={`animate-spin text-indigo-300 fill-indigo-600 ${size}`}
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5424 39.6781 93.9676 39.0409Z" fill="currentFill"/>
      </svg>
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

const UserSwitcher: React.FC<{ currentUser: User; onUserChange: (user: User) => void; }> = ({ currentUser, onUserChange }) => {
  return (
    <div className="flex items-center space-x-1 bg-gray-200 p-1 rounded-full shadow-inner">
      {Object.values(User).map((user) => {
        const isActive = currentUser === user;
        const activeClass = user === User.FELIPE
          ? 'bg-indigo-600 text-white'
          : 'bg-pink-500 text-white';

        return (
          <button
            key={user}
            onClick={() => onUserChange(user)}
            className={`flex items-center justify-center space-x-2 px-6 py-2 text-sm font-semibold rounded-full transition-all duration-300 focus:outline-none ${
              isActive ? `${activeClass} shadow-md` : 'text-gray-600 hover:bg-gray-300/50'
            }`}
          >
            <UserIcon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
            <span>{user}</span>
          </button>
        );
      })}
    </div>
  );
};

const Dashboard: React.FC<{ 
    items: Item[]; 
    totalBudget: number; 
    onUpdateBudget: (newBudget: number) => void;
    onViewRelevance: (relevance: Relevance) => void;
}> = ({ items, totalBudget, onUpdateBudget, onViewRelevance }) => {
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [editedBudget, setEditedBudget] = useState('');

    useEffect(() => {
        setEditedBudget(new Intl.NumberFormat('es-CL').format(totalBudget));
    }, [totalBudget]);

    const totalItems = items.length;
    const completedItems = items.filter(item => item.completed).length;
    const progress = totalItems > 0 ? (completedItems / totalItems) : 0;
    const completedCost = items.filter(item => item.completed).reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    const relevanceStats = useMemo(() => {
        const initialStats: Record<Relevance, { total: number, completed: number }> = {
            [Relevance.HIGH]: { total: 0, completed: 0 },
            [Relevance.MEDIUM]: { total: 0, completed: 0 },
            [Relevance.LOW]: { total: 0, completed: 0 },
        };
        return items.reduce((acc, item) => {
            if (acc[item.relevance]) {
                acc[item.relevance].total++;
                if (item.completed) {
                    acc[item.relevance].completed++;
                }
            }
            return acc;
        }, initialStats);
    }, [items]);

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-CL', { style: 'decimal', currency: 'CLP' }).format(value);
    };

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setEditedBudget(value === '' ? '' : new Intl.NumberFormat('es-CL').format(Number(value)));
    };

    const handleSaveBudget = () => {
        const newBudget = parseInt(editedBudget.replace(/\./g, ''), 10);
        if (!isNaN(newBudget) && newBudget !== totalBudget) {
            onUpdateBudget(newBudget);
        }
        setIsEditingBudget(false);
    };

    const handleCancelBudget = () => {
        setEditedBudget(new Intl.NumberFormat('es-CL').format(totalBudget));
        setIsEditingBudget(false);
    };
    
    const handleRelevanceClick = (relevance: Relevance) => {
        onViewRelevance(relevance);
    };

    const radius = 50;
    const circumference = Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <section className="grid grid-cols-1 gap-4">
            {/* Progreso General */}
            <div className="bg-white p-6 rounded-2xl shadow-md text-center">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Progreso General</h3>
                <div className="relative w-48 h-24 mx-auto">
                    <svg className="w-full h-full" viewBox="0 0 120 60">
                        <path
                            d="M 10 55 A 50 50 0 0 1 110 55"
                            fill="none"
                            stroke="#F3F4F6"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                        <path
                            d="M 10 55 A 50 50 0 0 1 110 55"
                            fill="none"
                            stroke="#4F46E5"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center -mt-2">
                        <span className="text-3xl font-bold text-gray-800">{completedItems}/{totalItems}</span>
                    </div>
                </div>
            </div>

            {/* Presupuesto */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-700">Presupuesto</h3>
                    {!isEditingBudget && (
                        <button onClick={() => setIsEditingBudget(true)} className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-gray-100" aria-label="Editar presupuesto">
                            <PencilIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
                {isEditingBudget ? (
                     <div>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                type="text"
                                value={editedBudget}
                                onChange={handleBudgetChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveBudget();
                                    if (e.key === 'Escape') handleCancelBudget();
                                }}
                                className="w-full pl-7 pr-2 py-1 text-2xl font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center justify-end mt-2 space-x-1">
                           <button onClick={handleSaveBudget} className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100" aria-label="Guardar">
                               <CheckIcon className="h-5 w-5" />
                           </button>
                           <button onClick={handleCancelBudget} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200" aria-label="Cancelar">
                               <XIcon className="h-5 w-5" />
                           </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-3xl font-bold text-gray-800">${formatCurrency(completedCost)} / ${formatCurrency(totalBudget)}</p>
                        <p className="text-sm font-medium text-gray-500 mt-1">Resta: ${formatCurrency(totalBudget - completedCost)}</p>
                         <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${totalBudget > 0 ? (completedCost / totalBudget) * 100 : 0}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Relevancia */}
            <div className="bg-white p-6 rounded-2xl shadow-md">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Relevancia</h3>
                <div className="space-y-4">
                    <button onClick={() => handleRelevanceClick(Relevance.HIGH)} className="w-full text-left p-2 rounded-lg transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-300">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-semibold text-red-700">Alta</span>
                            <span className="font-mono text-sm text-gray-600">
                                {relevanceStats[Relevance.HIGH].completed}/{relevanceStats[Relevance.HIGH].total}
                            </span>
                        </div>
                        <div className="w-full bg-red-100 rounded-full h-2.5">
                            <div 
                                className="bg-red-500 h-2.5 rounded-full" 
                                style={{ 
                                    width: `${relevanceStats[Relevance.HIGH].total > 0 ? (relevanceStats[Relevance.HIGH].completed / relevanceStats[Relevance.HIGH].total) * 100 : 0}%`, 
                                    transition: 'width 0.5s ease-in-out' 
                                }}
                            ></div>
                        </div>
                    </button>
                    <button onClick={() => handleRelevanceClick(Relevance.MEDIUM)} className="w-full text-left p-2 rounded-lg transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-semibold text-yellow-700">Media</span>
                            <span className="font-mono text-sm text-gray-600">
                                {relevanceStats[Relevance.MEDIUM].completed}/{relevanceStats[Relevance.MEDIUM].total}
                            </span>
                        </div>
                        <div className="w-full bg-yellow-100 rounded-full h-2.5">
                            <div 
                                className="bg-yellow-500 h-2.5 rounded-full" 
                                style={{ 
                                    width: `${relevanceStats[Relevance.MEDIUM].total > 0 ? (relevanceStats[Relevance.MEDIUM].completed / relevanceStats[Relevance.MEDIUM].total) * 100 : 0}%`, 
                                    transition: 'width 0.5s ease-in-out' 
                                }}
                            ></div>
                        </div>
                    </button>
                    <button onClick={() => handleRelevanceClick(Relevance.LOW)} className="w-full text-left p-2 rounded-lg transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-semibold text-blue-700">Baja</span>
                            <span className="font-mono text-sm text-gray-600">
                                {relevanceStats[Relevance.LOW].completed}/{relevanceStats[Relevance.LOW].total}
                            </span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2.5">
                            <div 
                                className="bg-blue-500 h-2.5 rounded-full" 
                                style={{ 
                                    width: `${relevanceStats[Relevance.LOW].total > 0 ? (relevanceStats[Relevance.LOW].completed / relevanceStats[Relevance.LOW].total) * 100 : 0}%`, 
                                    transition: 'width 0.5s ease-in-out' 
                                }}
                            ></div>
                        </div>
                    </button>
                </div>
            </div>
        </section>
    );
};

const ProgressBySpace: React.FC<{ items: Item[]; onCategoryClick: (category: Category) => void; }> = ({ items, onCategoryClick }) => {
    const statsByCategory = useMemo(() => {
        const categoryMap = new Map<Category, { total: number, completed: number }>();
        for (const item of items) {
            if (!categoryMap.has(item.category)) {
                categoryMap.set(item.category, { total: 0, completed: 0 });
            }
            const stats = categoryMap.get(item.category)!;
            stats.total++;
            if (item.completed) {
                stats.completed++;
            }
        }
        return categoryMap;
    }, [items]);

    return (
        <section className="mt-6 mb-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Progreso por Espacio</h2>
            <div className="flex space-x-4 overflow-x-auto pb-4 horizontal-scroll-cards" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {CATEGORIES
                    .filter(cat => statsByCategory.has(cat.id))
                    .map(category => {
                        const stats = statsByCategory.get(category.id)!;
                        const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                        return (
                            <button
                                key={category.id}
                                onClick={() => onCategoryClick(category.id)}
                                className="flex-shrink-0 w-36 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between text-center transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                            >
                                <div className="flex-grow flex flex-col justify-center items-center">
                                    <category.icon className="h-10 w-10 text-gray-400 mb-3" />
                                    <p className="text-sm font-semibold text-gray-700 truncate w-full" title={category.name}>{category.name}</p>
                                </div>
                                <div className="w-full mt-3">
                                    <div className="h-1.5 w-full bg-gray-200 rounded-full mb-1.5">
                                        <div
                                            className="bg-blue-500 h-1.5 rounded-full"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs font-mono text-gray-500">{`${stats.completed}/${stats.total} Productos`}</p>
                                 </div>
                            </button>
                        );
                })}
            </div>
            <style>{`
                .horizontal-scroll-cards::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    );
};

interface Activity {
  type: 'added' | 'completed' | 'deleted';
  item: Item;
  date: Date;
}

const ActivityFeed: React.FC<{ activities: Activity[] }> = ({ activities }) => {
    const formatRelativeTime = (date: Date) => {
        if (!date || !(date instanceof Date)) return 'Hace un momento';
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 5) return `justo ahora`;
        if (seconds < 60) return `hace ${seconds} seg.`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `hace ${minutes} min.`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `hace ${hours} h.`;
        
        const days = Math.floor(hours / 24);
        if (days === 1) return `ayer`;
        if (days < 7) return `hace ${days} días`;
        
        return new Intl.DateTimeFormat('es-CL', {
            day: 'numeric',
            month: 'long',
        }).format(date);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <ClockIcon className="h-6 w-6 mr-2 text-gray-400" />
                Actividad Reciente
            </h2>
            {activities.length > 0 ? (
                 <ul className="space-y-2">
                    {activities.map(activity => {
                        const { type, item, date } = activity;
                        const user = type === 'added' ? item.addedBy : (type === 'completed' ? item.completedBy : item.deletedBy);
                        const actionText = type === 'added' ? 'agregó' : (type === 'completed' ? 'completó' : 'eliminó');
                        const userColor = user === User.VALERIA ? 'text-pink-600' : 'text-indigo-600';

                        return (
                        <li key={`${item.id}-${type}-${date.getTime()}`} className="flex items-start space-x-3 p-2 rounded-lg transition-colors hover:bg-gray-50">
                            <div className="flex-shrink-0 pt-1">
                                {type === 'added' ? (
                                    <UserIcon className={`h-5 w-5 rounded-full p-0.5 ${user === User.VALERIA ? 'text-pink-500 bg-pink-100' : 'text-indigo-500 bg-indigo-100'}`} />
                                ) : type === 'completed' ? (
                                    <div className={`h-5 w-5 rounded-full flex items-center justify-center ${user === User.VALERIA ? 'bg-pink-500' : 'bg-indigo-600'}`}>
                                        <CheckIcon className="h-3 w-3 text-white" />
                                    </div>
                                ) : (
                                    <div className="h-5 w-5 rounded-full flex items-center justify-center bg-red-100">
                                        <TrashIcon className="h-3 w-3 text-red-600" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">
                                    <span className={`font-semibold ${userColor}`}>{user || 'Alguien'}</span>
                                    {' '}{actionText}{' '}
                                    <span className={`font-semibold ${type === 'deleted' ? 'line-through text-gray-700' : 'text-gray-800'}`}>{item.name}</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(date)}</p>
                            </div>
                        </li>
                    )})}
                </ul>
            ) : (
                <div className="text-center text-gray-500 py-4 border-t border-gray-200 mt-4">
                    <p>No hay actividad reciente.</p>
                </div>
            )}
        </div>
    );
};


const CategoryItemsModal: React.FC<{
    category: Category;
    items: Item[];
    onClose: () => void;
}> = ({ category, items, onClose }) => {
    const categoryInfo = CATEGORIES.find(c => c.id === category);
    const categoryItems = items.filter(item => item.category === category);
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    const sortedCategoryItems = useMemo(() => {
        const relevanceOrder = {
            [Relevance.HIGH]: 0,
            [Relevance.MEDIUM]: 1,
            [Relevance.LOW]: 2,
        };
        return [...categoryItems].sort((a, b) => {
            // 1. Incomplete items come before completed items
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            // 2. For incomplete items, sort by relevance (High > Medium > Low)
            if (!a.completed) {
                const relevanceComparison = relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
                if (relevanceComparison !== 0) {
                    return relevanceComparison;
                }
            }
            // 3. As a tie-breaker (or for completed items), sort alphabetically
            return a.name.localeCompare(b.name);
        });
    }, [categoryItems]);

    if (!categoryInfo) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                        <categoryInfo.icon className="h-7 w-7 text-gray-500" />
                        <h2 className="text-xl font-bold text-gray-800">Productos de {categoryInfo.name}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <ul className="space-y-3">
                        {sortedCategoryItems.length > 0 ? (
                            sortedCategoryItems.map(item => (
                                <li key={item.id} className={`flex justify-between items-center p-3 rounded-lg ${item.completed ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}>
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center border-2 ${item.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                            {item.completed && <CheckIcon className="h-4 w-4 text-white" />}
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`${item.completed ? 'line-through' : 'font-medium text-gray-700'} truncate`}>
                                                {item.name} {item.quantity > 1 && `(x${item.quantity})`}
                                            </span>
                                            <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${RELEVANCE_STYLES[item.relevance].bg} ${RELEVANCE_STYLES[item.relevance].text}`}>
                                                {item.relevance}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`font-semibold flex-shrink-0 ml-4 ${item.completed ? 'line-through' : 'text-gray-800'}`}>
                                        {formatCurrency(item.price * (item.quantity || 1))}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">No hay productos en esta categoría.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const RelevanceItemsModal: React.FC<{
    relevance: Relevance;
    items: Item[];
    onClose: () => void;
}> = ({ relevance, items, onClose }) => {
    const relevanceStyle = RELEVANCE_STYLES[relevance];
    const relevanceItems = items.filter(item => item.relevance === relevance);
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                        <span className={`h-4 w-4 rounded-full ${relevanceStyle.dot}`}></span>
                        <h2 className={`text-lg font-bold ${relevanceStyle.text}`}>Productos de Relevancia {relevance}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <ul className="space-y-3">
                        {relevanceItems.length > 0 ? (
                            relevanceItems.map(item => (
                                <li key={item.id} className={`flex justify-between items-center p-3 rounded-lg ${item.completed ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}>
                                    <div className="flex items-center space-x-3">
                                       <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center border-2 ${item.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                         {item.completed && <CheckIcon className="h-4 w-4 text-white" />}
                                       </div>
                                       <span className={`${item.completed ? 'line-through' : 'font-medium text-gray-700'}`}>
                                          {item.name} {item.quantity > 1 && `(x${item.quantity})`}
                                       </span>
                                    </div>
                                    <span className={`font-semibold ${item.completed ? 'line-through' : 'text-gray-800'}`}>
                                        {formatCurrency(item.price * (item.quantity || 1))}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">No hay productos con esta relevancia.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};


const EditItemModal: React.FC<{
    item: Item;
    onUpdate: (id: string, dataToUpdate: { 
        name: string; 
        price: number; 
        category: Category; 
        relevance: Relevance; 
        quantity: number; 
        addedBy?: User; 
        completedBy?: User | null;
    }) => void;
    onClose: () => void;
}> = ({ item, onUpdate, onClose }) => {
    const [name, setName] = useState(item.name);
    const [price, setPrice] = useState(new Intl.NumberFormat('es-CL').format(item.price));
    const [category, setCategory] = useState<Category>(item.category);
    const [relevance, setRelevance] = useState<Relevance>(item.relevance);
    const [quantity, setQuantity] = useState((item.quantity || 1).toString());
    
    const [responsibleUser, setResponsibleUser] = useState<User | null | undefined>(
        item.completed ? item.completedBy : item.addedBy
    );
    const userFieldLabel = item.completed ? "Completado por" : "Agregado por";


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && price && category) {
            const commonData = {
                name,
                price: parseInt(price.replace(/\./g, ''), 10),
                category,
                relevance,
                quantity: parseInt(quantity, 10) || 1,
            };

            const dataToUpdate = item.completed 
                ? { ...commonData, completedBy: responsibleUser }
                : { ...commonData, addedBy: responsibleUser as User };

            onUpdate(item.id, dataToUpdate);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800">Editar Item</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="editItemName" className="block text-sm font-medium text-gray-700">Nombre del Item *</label>
                        <input
                            id="editItemName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="editItemCategory" className="block text-sm font-medium text-gray-700">Espacio / Categoría *</label>
                        <select id="editItemCategory" value={category} onChange={(e) => setCategory(e.target.value as Category)} required
                            className="appearance-none mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            style={selectArrowStyle}
                        >
                            {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="editItemPrice" className="block text-sm font-medium text-gray-700">Precio (CLP) *</label>
                            <div className="relative mt-1">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-400 sm:text-sm">$</span>
                                </div>
                                <input
                                    id="editItemPrice"
                                    type="text"
                                    value={price}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value === '') {
                                            setPrice('');
                                        } else {
                                            setPrice(new Intl.NumberFormat('es-CL').format(Number(value)));
                                        }
                                    }}
                                    className="w-full pl-7 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                             <label htmlFor="editItemQuantity" className="block text-sm font-medium text-gray-700">Cantidad *</label>
                             <input
                                id="editItemQuantity"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                min="1"
                                className="mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="editItemRelevance" className="block text-sm font-medium text-gray-700">Relevancia</label>
                            <select id="editItemRelevance" value={relevance} onChange={(e) => setRelevance(e.target.value as Relevance)}
                                className="appearance-none mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                style={selectArrowStyle}
                            >
                                {Object.values(Relevance).map(rel => <option key={rel} value={rel}>{rel}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="editItemUser" className="block text-sm font-medium text-gray-700">{userFieldLabel}</label>
                            <select id="editItemUser" value={responsibleUser || ''} onChange={(e) => setResponsibleUser(e.target.value as User)}
                                className="appearance-none mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                style={selectArrowStyle}
                            >
                                {Object.values(User).map(user => <option key={user} value={user}>{user}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full px-4 py-3 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">Guardar Cambios</button>
                </form>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
    title: string;
    children: React.ReactNode;
    confirmText: string;
    confirmButtonClass?: string;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ title, children, confirmText, confirmButtonClass = 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500', onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm m-4 text-center animate-scale-up">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
                <div className="text-gray-600 mb-6">
                    {children}
                </div>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 text-base font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2 text-base font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const EnterPriceModal: React.FC<{
    item: Item;
    onConfirm: (item: Item, price: number) => void;
    onClose: () => void;
}> = ({ item, onConfirm, onClose }) => {
    const [price, setPrice] = useState('');

    const handleConfirm = () => {
        const numericPrice = parseInt(price.replace(/\./g, ''), 10);
        if (!isNaN(numericPrice) && numericPrice >= 0) {
            onConfirm(item, numericPrice);
        }
    };
    
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value === '') {
            setPrice('');
        } else {
            setPrice(new Intl.NumberFormat('es-CL').format(Number(value)));
        }
    };

    const isConfirmDisabled = price === '';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm m-4 text-center animate-scale-up">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Ingresar Precio</h2>
                <p className="text-gray-600 mb-6">
                    Para completar <span className="font-semibold text-gray-900">"{item.name}"</span>, por favor ingresa su precio final.
                </p>
                <div>
                    <label htmlFor="finalPrice" className="sr-only">Precio (CLP)</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-400 sm:text-sm">$</span>
                        </div>
                        <input
                            id="finalPrice"
                            type="text"
                            value={price}
                            onChange={handlePriceChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isConfirmDisabled) handleConfirm();
                                if (e.key === 'Escape') onClose();
                            }}
                            placeholder="0"
                            className="w-full text-center pl-7 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400"
                            required
                            autoFocus
                        />
                    </div>
                </div>
                <div className="flex justify-center space-x-4 mt-6">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-base font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="px-6 py-2 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-300"
                    >
                        Confirmar y Completar
                    </button>
                </div>
            </div>
        </div>
    );
};


const ItemCompra: React.FC<{
    item: Item;
    isSelectionMode: boolean;
    isSelected: boolean;
    onSelectItem: (id: string) => void;
    onToggleComplete: (id: string, completed: boolean, name: string) => void;
    onRequestPrice: (item: Item) => void;
    onEdit: (item: Item) => void;
    onDelete: (id: string) => void;
}> = ({ item, isSelectionMode, isSelected, onSelectItem, onToggleComplete, onRequestPrice, onEdit, onDelete }) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    const handleToggle = () => {
        if (!item.completed && (!item.price || item.price === 0)) {
            onRequestPrice(item);
        } else {
            onToggleComplete(item.id, !item.completed, item.name);
        }
    };

    const relevancePillStyles: Record<Relevance, string> = {
        [Relevance.HIGH]: 'bg-red-100 text-red-700',
        [Relevance.MEDIUM]: 'bg-yellow-100 text-yellow-700',
        [Relevance.LOW]: 'bg-green-100 text-green-700',
    };

    const quantity = item.quantity || 1;

    // Determine which user and date to display based on completion status
    const userToShow = item.completed ? item.completedBy : item.addedBy;
    const dateToShow = item.completed ? item.completedAt : item.createdAt;

    return (
        <li className={`group flex items-center p-3 bg-white rounded-xl shadow-sm border transition-all duration-200 ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100'}`}>
            {isSelectionMode ? (
                 <div className="flex-shrink-0 h-10 w-10 mr-4 flex items-center justify-center">
                     <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectItem(item.id)}
                        className="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        aria-label={`Seleccionar ${item.name}`}
                    />
                </div>
            ) : (
                <button
                    onClick={handleToggle}
                    className={`flex-shrink-0 h-10 w-10 rounded-full mr-4 flex items-center justify-center border-2 transition-colors duration-300 ${item.completed ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                    aria-label={item.completed ? `Marcar "${item.name}" como pendiente` : `Marcar "${item.name}" como completado`}
                >
                    {item.completed && <CheckIcon className="h-6 w-6 text-white" />}
                </button>
            )}
            
            <div className={`flex-grow ${item.completed ? 'text-gray-400' : ''}`}>
                <p className={`font-semibold text-gray-800 ${item.completed ? 'line-through' : ''}`}>
                    {item.name} {quantity > 1 && <span className="font-normal text-gray-500">(x{quantity})</span>}
                </p>
                <div className="flex items-center space-x-2 text-sm mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${relevancePillStyles[item.relevance]}`}>
                        {item.relevance}
                    </span>
                    
                    {userToShow && (
                        <div className="flex items-center space-x-1.5 whitespace-nowrap">
                            <span className="text-gray-400">&bull;</span>
                            <UserIcon className={`h-3.5 w-3.5 ${userToShow === User.VALERIA ? 'text-pink-500' : 'text-indigo-500'}`} />
                            <span className="text-xs font-medium text-gray-500">
                                por {userToShow}
                            </span>
                        </div>
                    )}
                    
                    {dateToShow && (
                         <div className="flex items-center space-x-1.5 whitespace-nowrap">
                            <span className="text-gray-400">&bull;</span>
                            <span className="text-xs font-medium text-gray-500">
                                {new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(dateToShow)}.
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="ml-4 flex items-center space-x-2">
                <div className="text-right">
                    <p className={`font-bold text-lg ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {(item.price || 0) > 0 ? formatCurrency(item.price * quantity) : '-'}
                    </p>
                    {quantity > 1 && (item.price || 0) > 0 && (
                        <p className={`text-xs ${item.completed ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                            {formatCurrency(item.price)} c/u
                        </p>
                    )}
                </div>
                {!isSelectionMode && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={() => onEdit(item)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-full" aria-label={`Editar ${item.name}`}>
                            <PencilIcon className="h-5 w-5" />
                        </button>
                        <button onClick={() => onDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-full" aria-label={`Eliminar ${item.name}`}>
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>
        </li>
    );
};

const FormularioAgregarItem: React.FC<{ onAddItem: (item: Omit<Item, 'id' | 'completed' | 'completedBy' | 'createdAt' | 'completedAt' | 'addedBy'>) => void; }> = ({ onAddItem }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<Category | ''>('');
    const [relevance, setRelevance] = useState<Relevance>(Relevance.MEDIUM);
    const [quantity, setQuantity] = useState('1');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && category) {
            onAddItem({ 
                name, 
                price: 0, 
                category, 
                relevance,
                quantity: parseInt(quantity, 10) || 1 
            });
            setName('');
            setCategory('');
            setRelevance(Relevance.MEDIUM);
            setQuantity('1');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <PlusCircleIcon className="h-6 w-6 mr-2 text-gray-400" />
                Agregar Item Manualmente
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Nombre del Item *</label>
                    <input
                        id="itemName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: 2 sillas, 1 mesa de centro..."
                        className="mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400"
                        required
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="itemQuantity" className="block text-sm font-medium text-gray-700">Cantidad *</label>
                        <input
                            id="itemQuantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            min="1"
                            className="mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="itemCategory" className="block text-sm font-medium text-gray-700">Espacio / Categoría *</label>
                        <select id="itemCategory" value={category} onChange={(e) => setCategory(e.target.value as Category)} required 
                          className="appearance-none mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                          style={selectArrowStyle}
                        >
                            <option value="" disabled className="text-gray-500">Seleccionar...</option>
                            {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="itemRelevance" className="block text-sm font-medium text-gray-700">Relevancia</label>
                        <select id="itemRelevance" value={relevance} onChange={(e) => setRelevance(e.target.value as Relevance)} 
                          className="appearance-none mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                          style={selectArrowStyle}
                        >
                            {Object.values(Relevance).map(rel => <option key={rel} value={rel}>{rel}</option>)}
                        </select>
                    </div>
                </div>
                <button type="submit" className="w-full px-4 py-3 text-base font-semibold text-gray-600 bg-violet-200 rounded-lg hover:bg-violet-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors">Agregar</button>
            </form>
        </div>
    );
};

const SuggestionsSection: React.FC<{ onAddSuggestion: (item: Omit<Item, 'id'|'completed'|'completedBy' | 'createdAt' | 'completedAt' | 'addedBy'>) => void }> = ({ onAddSuggestion }) => {
    const [category, setCategory] = useState<Category>(Category.LIVING);
    const [suggestions, setSuggestions] = useState<SuggestedItemResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGetSuggestions = async () => {
        setLoading(true);
        setError(null);
        setSuggestions([]);
        try {
            const result = await getSuggestions(category);
            setSuggestions(result);
        } catch (e) {
            setError("Error al obtener sugerencias.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-200">
            <div className="grid grid-cols-2 gap-4 items-center">
                 <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value as Category)} 
                    className="appearance-none w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-800"
                    style={selectArrowStyle}
                 >
                    {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{`Sugerencias para ${cat.name}`}</option>)}
                </select>
                <button onClick={handleGetSuggestions} disabled={loading} className="px-4 py-2 font-semibold text-white bg-orange-400 rounded-lg hover:bg-orange-500 disabled:bg-orange-200 flex items-center justify-center space-x-2 transition-colors">
                    <SuggestionsIcon className="h-5 w-5" />
                    <span>{loading ? "Generando..." : "Sugerencias de Items"}</span>
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {loading && <div className="mt-4"><Loader /></div>}
            {suggestions.length > 0 && (
                <ul className="space-y-2 mt-4">
                    {suggestions.map((sug, index) => (
                        <li key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                            <div>
                                <p className="font-semibold text-gray-700">{sug.name}</p>
                                <p className="text-sm text-gray-500">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(sug.price)} - {sug.relevance}</p>
                            </div>
                            <button onClick={() => onAddSuggestion({...sug, category, quantity: 1})} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full" aria-label={`Agregar ${sug.name}`}>
                                <PlusIcon className="h-5 w-5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const Filters: React.FC<{
  activeCategory: Category | null;
  setActiveCategory: (category: Category | null) => void;
  statusFilter: 'Pendientes' | 'Completados' | 'Todos';
  setStatusFilter: (status: 'Pendientes' | 'Completados' | 'Todos') => void;
  relevanceFilters: Set<Relevance>;
  setRelevanceFilters: (filters: Set<Relevance>) => void;
  categoryCounts: Map<Category | null, number>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSelectionMode: boolean;
  toggleSelectionMode: () => void;
}> = ({ activeCategory, setActiveCategory, statusFilter, setStatusFilter, relevanceFilters, setRelevanceFilters, categoryCounts, searchQuery, setSearchQuery, isSelectionMode, toggleSelectionMode }) => {
    
    const handleRelevanceToggle = (relevance: Relevance) => {
        const newFilters = new Set(relevanceFilters);
        if (newFilters.has(relevance)) {
            newFilters.delete(relevance);
        } else {
            newFilters.add(relevance);
        }
        setRelevanceFilters(newFilters);
    };
    
    const relevanceFilterConfig = [
      { id: Relevance.HIGH, label: 'Alta' },
      { id: Relevance.MEDIUM, label: 'Media' },
      { id: Relevance.LOW, label: 'Baja' }
    ];

    const categoryTabs = [
        { id: null, name: 'Todos', icon: HouseIcon },
        ...CATEGORIES
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            {/* Category Tabs */}
            <div className="flex space-x-1 sm:space-x-2 border-b border-gray-200 overflow-x-auto pb-0 -mx-4 px-4 horizontal-scroll-cards" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {categoryTabs.map(cat => {
                    const count = categoryCounts.get(cat.id);
                    const isVisible = cat.id === null || (count !== undefined && count > 0) || CATEGORIES.some(c => c.id === cat.id);
                    if(!isVisible) return null;

                    return (
                    <button 
                        key={cat.id || 'all'}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex-shrink-0 flex items-center space-x-2 py-3 px-3 sm:px-4 text-sm font-semibold transition-colors border-b-2 ${activeCategory === cat.id ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-800'}`}
                    >
                        <cat.icon className="h-5 w-5" />
                        <span>{cat.name}</span>
                        {count !== undefined && (
                            <span className={`ml-1.5 text-xs font-mono px-2 py-0.5 rounded-full transition-colors ${activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                {count}
                            </span>
                        )}
                    </button>
                    )
                })}
            </div>
            <style>{`.horizontal-scroll-cards::-webkit-scrollbar { display: none; }`}</style>
            
            {/* Filter Pills */}
            <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => { setStatusFilter('Todos'); setRelevanceFilters(new Set()); }} className={`px-3 py-1 text-sm font-semibold rounded-full ${statusFilter === 'Todos' && relevanceFilters.size === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Ver Todos</button>
                    <button onClick={() => setStatusFilter('Pendientes')} className={`px-3 py-1 text-sm font-semibold rounded-full ${statusFilter === 'Pendientes' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Pendientes</button>
                    <button onClick={() => setStatusFilter('Completados')} className={`px-3 py-1 text-sm font-semibold rounded-full ${statusFilter === 'Completados' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Completados</button>
                </div>
                 <div className="flex flex-wrap items-center gap-2">
                    {relevanceFilterConfig.map(rel => (
                        <button key={rel.id} onClick={() => handleRelevanceToggle(rel.id)} className={`px-3 py-1 text-sm font-semibold rounded-full ${relevanceFilters.has(rel.id) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            {rel.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar & Select Button */}
             <div className="flex items-center gap-4 mt-4">
                <div className="relative flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-lg border-0 bg-gray-100 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        placeholder="Buscar por nombre..."
                    />
                </div>
                <button
                    onClick={toggleSelectionMode}
                    className={`flex-shrink-0 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                        isSelectionMode 
                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                >
                    {isSelectionMode ? 'Cancelar' : 'Seleccionar Items'}
                </button>
            </div>
        </div>
    );
};

const MultiSelectActionBar: React.FC<{
    count: number;
    onDelete: () => void;
    onCancel: () => void;
}> = ({ count, onDelete, onCancel }) => {
    if (count === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-20 animate-slide-up">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                <span className="font-semibold text-gray-800">{count} item{count > 1 ? 's' : ''} seleccionado{count > 1 ? 's' : ''}</span>
                <div className="flex space-x-3">
                     <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onDelete}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                        <TrashIcon className="h-4 w-4" />
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper to robustly convert Firestore Timestamps or existing Dates.
const toDate = (timestamp: any): Date | null => {
  if (!timestamp) {
    return null;
  }
  // If it's already a JS Date, return it.
  if (timestamp instanceof Date) {
    return timestamp;
  }
  // If it's a Firestore Timestamp, convert it.
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  // As a fallback for other potential date representations (e.g., from strings)
  const d = new Date(timestamp);
  if (!isNaN(d.getTime())) {
      return d;
  }
  return null;
};


const App: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User>(User.FELIPE);
    const [totalBudget, setTotalBudget] = useState(5000000); // Default budget
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
    const [viewingRelevance, setViewingRelevance] = useState<Relevance | null>(null);
    const [confirmingToggle, setConfirmingToggle] = useState<{ id: string; name: string; completed: boolean } | null>(null);
    const [itemRequiringPrice, setItemRequiringPrice] = useState<Item | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    
    // Multi-select states
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isConfirmingMultiDelete, setIsConfirmingMultiDelete] = useState(false);


    // Filter states
    const [statusFilter, setStatusFilter] = useState<'Pendientes' | 'Completados' | 'Todos'>('Todos');
    const [relevanceFilters, setRelevanceFilters] = useState<Set<Relevance>>(new Set());
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const seedData = async () => {
            const seedRef = doc(db, 'app_config', 'initial_seed');
            const seedDoc = await getDoc(seedRef);

            if (!seedDoc.exists()) {
                console.log("First time setup: Seeding initial data...");
                const batch = writeBatch(db);
                const itemsCol = collection(db, 'items');
                initialItems.forEach(item => {
                    const docRef = doc(itemsCol);
                    batch.set(docRef, { 
                        ...item, 
                        completed: false, 
                        completedBy: null,
                        createdAt: serverTimestamp(),
                        addedBy: User.FELIPE 
                    });
                });
                batch.set(seedRef, { seeded: true, timestamp: serverTimestamp() });
                await batch.commit();
            }
        };

        seedData();

        const itemsQuery = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
        const unsubscribeItems = onSnapshot(itemsQuery, (querySnapshot) => {
            const itemsData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                // Use the robust toDate helper to normalize timestamps consistently.
                const item: Item = {
                    ...(data as Omit<Item, 'id'>),
                    id: doc.id,
                    createdAt: toDate(data.createdAt),
                    completedAt: toDate(data.completedAt),
                    deletedAt: toDate(data.deletedAt),
                };
                return item;
            });
            setItems(itemsData);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to items collection:", error);
            setLoading(false);
        });

        const budgetDocRef = doc(db, 'app_config', 'budget');
        const unsubscribeBudget = onSnapshot(budgetDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setTotalBudget(docSnap.data()?.total || 5000000);
            } else {
                setDoc(budgetDocRef, { total: 5000000 });
            }
        });

        return () => {
            unsubscribeItems();
            unsubscribeBudget();
        };
    }, []);

    const visibleItems = useMemo(() => items.filter(item => !item.deleted), [items]);

    const handleAddItem = async (item: Omit<Item, 'id' | 'completed' | 'completedBy' | 'createdAt' | 'addedBy' | 'completedAt'>) => {
        try {
            await addDoc(collection(db, 'items'), { 
                ...item, 
                completed: false, 
                completedBy: null,
                createdAt: serverTimestamp(),
                completedAt: null,
                addedBy: currentUser
            });
        } catch (error) {
            console.error("Error adding item: ", error);
        }
    };
    
    const handleToggleComplete = async (id: string, completed: boolean) => {
        const itemRef = doc(db, 'items', id);
        try {
            await updateDoc(itemRef, {
                completed: completed,
                completedBy: completed ? currentUser : null,
                completedAt: completed ? serverTimestamp() : null
            });
        } catch (error) {
            console.error("Error updating item: ", error);
        }
    };
    
    const handleConfirmToggle = () => {
        if (confirmingToggle) {
            handleToggleComplete(confirmingToggle.id, confirmingToggle.completed);
            setConfirmingToggle(null);
        }
    };

    const handlePriceAndComplete = async (item: Item, price: number) => {
        const itemRef = doc(db, 'items', item.id);
        setItemRequiringPrice(null); 
        try {
            await updateDoc(itemRef, {
                price: price,
                completed: true,
                completedBy: currentUser,
                completedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating price and completing item: ", error);
        }
    };

    const handleUpdateBudget = async (newBudget: number) => {
        const budgetDocRef = doc(db, 'app_config', 'budget');
        try {
            await setDoc(budgetDocRef, { total: newBudget });
        } catch (error) {
            console.error("Error updating budget: ", error);
        }
    };

    const handleUpdateItem = async (id: string, dataToUpdate: { name: string; price: number; category: Category; relevance: Relevance; quantity: number; addedBy?: User; completedBy?: User | null; }) => {
        const itemRef = doc(db, 'items', id);
        try {
            await updateDoc(itemRef, dataToUpdate);
            setEditingItem(null);
        } catch (error) {
            console.error("Error updating item: ", error);
        }
    };

    const handleDeleteItem = async () => {
        if (!deletingItemId) return;
        const itemRef = doc(db, 'items', deletingItemId);
        try {
             await updateDoc(itemRef, {
                deleted: true,
                deletedBy: currentUser,
                deletedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error deleting item: ", error);
        }
        setDeletingItemId(null);
    };

    const handleSeedData = async () => {
        setLoading(true);
        try {
            const batch = writeBatch(db);
            const itemsCol = collection(db, 'items');
            initialItems.forEach(item => {
                const docRef = doc(itemsCol);
                batch.set(docRef, { 
                    ...item, 
                    completed: false, 
                    completedBy: null,
                    createdAt: serverTimestamp(),
                    completedAt: null,
                    addedBy: currentUser
                });
            });
            
            const seedRef = doc(db, 'app_config', 'initial_seed');
            batch.set(seedRef, { seeded: true, timestamp: serverTimestamp() });

            await batch.commit();
        } catch (error) {
            console.error("Error seeding data: ", error);
            setLoading(false);
        }
    };

    // Multi-select handlers
    const toggleSelectionMode = () => {
        setIsSelectionMode(prev => !prev);
        setSelectedItems(new Set());
    };

    const handleSelectItem = (id: string) => {
        setSelectedItems(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    };

    const handleDeleteSelectedItems = async () => {
        if (selectedItems.size === 0) return;
        const batch = writeBatch(db);
        selectedItems.forEach(id => {
            const itemRef = doc(db, 'items', id);
            batch.update(itemRef, {
                deleted: true,
                deletedBy: currentUser,
                deletedAt: serverTimestamp()
            });
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error deleting selected items: ", error);
        } finally {
            setSelectedItems(new Set());
            setIsSelectionMode(false);
            setIsConfirmingMultiDelete(false);
        }
    };

    const preFilteredItems = useMemo(() => {
       return visibleItems
            .filter(item => {
                if (!searchQuery) return true;
                return item.name.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .filter(item => {
                if (statusFilter === 'Pendientes') return !item.completed;
                if (statusFilter === 'Completados') return item.completed;
                return true;
            })
            .filter(item => {
                if (relevanceFilters.size === 0) return true;
                return relevanceFilters.has(item.relevance);
            });
    }, [visibleItems, statusFilter, relevanceFilters, searchQuery]);

    const filteredItems = useMemo(() => {
        const relevanceOrder = {
            [Relevance.HIGH]: 0,
            [Relevance.MEDIUM]: 1,
            [Relevance.LOW]: 2,
        };
    
        const sorted = [...preFilteredItems].sort((a, b) => {
            // 1. Incomplete items come before completed items
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
    
            // 2. For incomplete items, sort by relevance (High > Medium > Low)
            if (!a.completed) {
                const relevanceComparison = relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
                if (relevanceComparison !== 0) {
                    return relevanceComparison;
                }
            }
            
            // 3. As a tie-breaker (or for completed items), sort alphabetically
            return a.name.localeCompare(b.name);
        });
    
        return sorted.filter(item => {
            if (!activeCategory) return true;
            return item.category === activeCategory;
        });
    }, [preFilteredItems, activeCategory]);

    const activityFeedItems = useMemo(() => {
        const activities: Activity[] = [];

        items.forEach(item => {
            if (item.createdAt instanceof Date) {
                activities.push({
                    type: 'added',
                    item,
                    date: item.createdAt,
                });
            }

            if (item.completed && item.completedAt instanceof Date) {
                activities.push({
                    type: 'completed',
                    item,
                    date: item.completedAt,
                });
            }

            if (item.deleted && item.deletedAt instanceof Date) {
                activities.push({
                    type: 'deleted',
                    item,
                    date: item.deletedAt,
                });
            }
        });

        return activities
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 7);
    }, [items]);

    const categoryCounts = useMemo(() => {
        const counts = new Map<Category | null, number>();
        counts.set(null, preFilteredItems.length);
        CATEGORIES.forEach(cat => {
            const count = preFilteredItems.filter(item => item.category === cat.id).length;
            counts.set(cat.id, count);
        });
        return counts;
    }, [preFilteredItems]);

    const itemToDelete = useMemo(() => 
        deletingItemId ? items.find(item => item.id === deletingItemId) : null, 
        [deletingItemId, items]
    );
    
    return (
        <div className="min-h-screen">
             <header className="bg-gray-100/80 backdrop-blur-sm sticky top-0 z-10 py-3 px-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center space-x-3">
                    <HouseIcon className="h-6 w-6 text-gray-700" />
                    <h1 className="text-lg font-bold text-gray-800">Tu Hogar Checklist</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
                 <div className="flex justify-center mb-6">
                    <UserSwitcher currentUser={currentUser} onUserChange={setCurrentUser} />
                </div>
                
                <div className="mb-6">
                    <Dashboard 
                        items={visibleItems} 
                        totalBudget={totalBudget} 
                        onUpdateBudget={handleUpdateBudget}
                        onViewRelevance={setViewingRelevance}
                    />
                </div>
                
                <div className="mb-6">
                    <ActivityFeed activities={activityFeedItems} />
                </div>

                <ProgressBySpace items={visibleItems} onCategoryClick={setViewingCategory} />

                <div className="mt-6">
                  <FormularioAgregarItem onAddItem={handleAddItem} />
                </div>
                <div className="my-6">
                  <SuggestionsSection onAddSuggestion={handleAddItem} />
                </div>
                
                <div className="my-6">
                  <Filters 
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                    relevanceFilters={relevanceFilters} setRelevanceFilters={setRelevanceFilters}
                    activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                    categoryCounts={categoryCounts}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    isSelectionMode={isSelectionMode}
                    toggleSelectionMode={toggleSelectionMode}
                  />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64"><Loader size="h-12 w-12" /></div>
                ) : (
                    <>
                        {visibleItems.length === 0 ? (
                            <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm mt-4 border border-gray-200">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <h3 className="mt-2 text-lg font-semibold text-gray-800">Tu lista está vacía</h3>
                                <p className="mt-1 text-sm text-gray-500">Comienza agregando un item o carga la lista de sugerencias inicial.</p>
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        onClick={handleSeedData}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                                        Cargar lista inicial
                                    </button>
                                </div>
                            </div>
                        ) : filteredItems.length > 0 ? (
                            <ul className="space-y-3 pb-24">
                                {filteredItems.map(item => (
                                    <ItemCompra 
                                        key={item.id}
                                        item={item}
                                        isSelectionMode={isSelectionMode}
                                        isSelected={selectedItems.has(item.id)}
                                        onSelectItem={handleSelectItem}
                                        onToggleComplete={(id, completed, name) => setConfirmingToggle({ id, completed, name })}
                                        onRequestPrice={setItemRequiringPrice}
                                        onEdit={setEditingItem}
                                        onDelete={setDeletingItemId}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-16 px-6 bg-white rounded-lg shadow-sm mt-4 border border-gray-200">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-lg font-semibold text-gray-800">No se encontraron productos</h3>
                                <p className="mt-1 text-sm text-gray-500">Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
             {editingItem && (
                <EditItemModal 
                    item={editingItem} 
                    onUpdate={handleUpdateItem}
                    onClose={() => setEditingItem(null)}
                />
            )}
            {viewingCategory && (
                <CategoryItemsModal
                    category={viewingCategory}
                    items={visibleItems}
                    onClose={() => setViewingCategory(null)}
                />
            )}
             {viewingRelevance && (
                <RelevanceItemsModal
                    relevance={viewingRelevance}
                    items={visibleItems}
                    onClose={() => setViewingRelevance(null)}
                />
            )}
            {confirmingToggle && (
                 <ConfirmationModal
                    title="Confirmar Acción"
                    confirmText="Confirmar"
                    onConfirm={handleConfirmToggle}
                    onCancel={() => setConfirmingToggle(null)}
                >
                    <p>
                        ¿Estás seguro de que quieres marcar <span className="font-semibold text-gray-900">"{confirmingToggle.name}"</span> como {confirmingToggle.completed ? 'completado' : 'pendiente'}?
                    </p>
                </ConfirmationModal>
            )}
            {itemRequiringPrice && (
                <EnterPriceModal
                    item={itemRequiringPrice}
                    onConfirm={handlePriceAndComplete}
                    onClose={() => setItemRequiringPrice(null)}
                />
            )}
            {itemToDelete && (
                <ConfirmationModal
                    title="Confirmar Eliminación"
                    confirmText="Eliminar"
                    confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    onConfirm={handleDeleteItem}
                    onCancel={() => setDeletingItemId(null)}
                >
                    <p>
                        ¿Estás seguro de que quieres eliminar <span className="font-semibold text-gray-900">"{itemToDelete.name}"</span>? Esta acción no se puede deshacer.
                    </p>
                </ConfirmationModal>
            )}
            {isSelectionMode && selectedItems.size > 0 && (
                <MultiSelectActionBar
                    count={selectedItems.size}
                    onDelete={() => setIsConfirmingMultiDelete(true)}
                    onCancel={toggleSelectionMode}
                />
            )}
            {isConfirmingMultiDelete && (
                <ConfirmationModal
                    title="Confirmar Eliminación Múltiple"
                    confirmText="Eliminar"
                    confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    onConfirm={handleDeleteSelectedItems}
                    onCancel={() => setIsConfirmingMultiDelete(false)}
                >
                    <p>
                        ¿Estás seguro de que quieres eliminar los <span className="font-semibold text-gray-900">{selectedItems.size} items</span> seleccionados? Esta acción no se puede deshacer.
                    </p>
                </ConfirmationModal>
            )}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scale-up {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                .animate-scale-up { animation: scale-up 0.2s ease-out forwards; }
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

// =================================================================================
// --- APP INITIALIZATION ---
// =================================================================================
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}