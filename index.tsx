import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  initializeApp 
} from "firebase/app";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  writeBatch
} from "firebase/firestore";

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
  completed: boolean;
  completedBy?: User | null;
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
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
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
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// =================================================================================
// --- FROM constants.ts ---
// =================================================================================
const CATEGORIES: { id: Category; name: string; icon: React.FC<{className?: string}> }[] = [
    { id: Category.LIVING, name: 'Living', icon: LivingIcon },
    { id: Category.KITCHEN, name: 'Cocina', icon: KitchenIcon },
    { id: Category.DINING, name: 'Comedor', icon: DiningIcon },
    { id: Category.MAIN_BEDROOM, name: 'Dormitorio Principal', icon: BedroomIcon },
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
const initialItems: Omit<Item, 'id' | 'completed' | 'completedBy'>[] = [
  // LAVANDERIA
  { name: 'Lavadora secadora', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 450000 },
  { name: 'Repisa para detergentes', category: Category.LAUNDRY, relevance: Relevance.LOW, price: 25000 },
  { name: 'Colgador plegable', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 30000 },
  { name: 'Plancha', category: Category.LAUNDRY, relevance: Relevance.MEDIUM, price: 20000 },
  { name: 'Tabla de Planchar', category: Category.LAUNDRY, relevance: Relevance.LOW, price: 25000 },
  { name: 'Ganchos para ropa', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 10000 },
  { name: 'Canasto ropa sucia', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 15000 },
  { name: 'Canasto ropa limpia', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 15000 },
  { name: 'Cortina Roller', category: Category.LAUNDRY, relevance: Relevance.HIGH, price: 40000 },
  // COCINA
  { name: 'Refrigerador', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 500000 },
  { name: 'Microondas', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 70000 },
  { name: 'Hervidor electrico', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 20000 },
  { name: 'Juego de Ollas', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 80000 },
  { name: 'Sarten grande', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 25000 },
  { name: 'Sarten pequeno', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 15000 },
  { name: 'Fuente de vidrio (budinera)', category: Category.KITCHEN, relevance: Relevance.LOW, price: 12000 },
  { name: 'Vajilla (12p)', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 60000 },
  { name: 'Vasos (x6)', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 15000 },
  { name: 'Jarro para jugo', category: Category.KITCHEN, relevance: Relevance.LOW, price: 8000 },
  { name: 'Tazas (x6)', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 18000 },
  { name: 'Juego de Cubiertos', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 30000 },
  { name: 'Colador', category: Category.KITCHEN, relevance: Relevance.LOW, price: 5000 },
  { name: 'Paños de cocina', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 7000 },
  { name: 'Abre latas', category: Category.KITCHEN, relevance: Relevance.LOW, price: 4000 },
  { name: 'Set de Cuchillos', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 35000 },
  { name: 'Freidora de aire', category: Category.KITCHEN, relevance: Relevance.LOW, price: 60000 },
  { name: 'Tostador de pan', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 20000 },
  { name: 'Escobillon y Pala', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 10000 },
  { name: 'Trapeador', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 12000 },
  { name: 'Cafetera', category: Category.KITCHEN, relevance: Relevance.LOW, price: 50000 },
  { name: 'Secador de loza', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 15000 },
  { name: '3 sillas altas de cocina americana', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 90000 },
  { name: 'Dispensador de lavaloza', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 8000 },
  { name: 'Dispensador de jabon', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 8000 },
  { name: 'Porta Esponja', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 5000 },
  { name: 'Porta servilleta', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 6000 },
  { name: 'Porta Toalla absorbente', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 10000 },
  { name: 'Licuadora', category: Category.KITCHEN, relevance: Relevance.MEDIUM, price: 45000 },
  { name: 'Set de Tupperware', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 20000 },
  { name: 'Tabla para picar (x2)', category: Category.KITCHEN, relevance: Relevance.HIGH, price: 12000 },
  // LIVING
  { name: 'Sofa en L', category: Category.LIVING, relevance: Relevance.MEDIUM, price: 600000 },
  { name: '2 Sillones individuales', category: Category.LIVING, relevance: Relevance.LOW, price: 250000 },
  { name: 'Mesa de Centro', category: Category.LIVING, relevance: Relevance.LOW, price: 80000 },
  { name: 'TV 55"', category: Category.LIVING, relevance: Relevance.MEDIUM, price: 350000 },
  { name: 'Mueble para TV', category: Category.LIVING, relevance: Relevance.MEDIUM, price: 120000 },
  { name: 'Alfombra', category: Category.LIVING, relevance: Relevance.MEDIUM, price: 90000 },
  { name: 'Mesa Lateral', category: Category.LIVING, relevance: Relevance.LOW, price: 40000 },
  { name: 'Cojines Decorativos (x4)', category: Category.LIVING, relevance: Relevance.LOW, price: 30000 },
  { name: 'Manta para Sofá', category: Category.LIVING, relevance: Relevance.LOW, price: 25000 },
  // COMEDOR
  { name: 'Comedor 6 sillas', category: Category.DINING, relevance: Relevance.MEDIUM, price: 300000 },
  { name: 'Florero', category: Category.DINING, relevance: Relevance.LOW, price: 15000 },
  { name: 'Camino de mesa', category: Category.DINING, relevance: Relevance.LOW, price: 12000 },
  { name: 'Individuales para mesa (x6)', category: Category.DINING, relevance: Relevance.LOW, price: 18000 },
  // DORMITORIO PIPE
  { name: 'Cama 1.5 plazas', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 200000 },
  { name: '2 juegos de sabanas 1.5p', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 50000 },
  { name: '2 cubrecamas 1.5p', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 70000 },
  { name: 'Basurero', category: Category.PIPE_BEDROOM, relevance: Relevance.LOW, price: 8000 },
  { name: 'Escritorio', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 90000 },
  { name: 'Silla de escritorio', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 60000 },
  { name: 'Cortina', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 45000 },
  { name: 'Lampara de escritorio', category: Category.PIPE_BEDROOM, relevance: Relevance.MEDIUM, price: 20000 },
  { name: 'Velador', category: Category.PIPE_BEDROOM, relevance: Relevance.HIGH, price: 40000 },
  // DORMITORIO PRINCIPAL
  { name: 'Cama 2 plazas', category: Category.MAIN_BEDROOM, relevance: Relevance.HIGH, price: 350000 },
  { name: '2 juegos de sabanas 2p', category: Category.MAIN_BEDROOM, relevance: Relevance.HIGH, price: 70000 },
  { name: 'Cubrecama 2p', category: Category.MAIN_BEDROOM, relevance: Relevance.HIGH, price: 50000 },
  { name: 'Almohadas (x2)', category: Category.MAIN_BEDROOM, relevance: Relevance.HIGH, price: 30000 },
  { name: 'Velador (x2)', category: Category.MAIN_BEDROOM, relevance: Relevance.MEDIUM, price: 80000 },
  { name: 'Lampara de velador (x2)', category: Category.MAIN_BEDROOM, relevance: Relevance.MEDIUM, price: 40000 },
  { name: 'Cortinas Roller duo', category: Category.MAIN_BEDROOM, relevance: Relevance.HIGH, price: 80000 },
  { name: 'Cómoda / Cajonera', category: Category.MAIN_BEDROOM, relevance: Relevance.MEDIUM, price: 120000 },
  // BAÑOS
  { name: 'Toallas de cuerpo (x4)', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 40000 },
  { name: 'Toallas de mano (x4)', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 20000 },
  { name: 'Set dispensadores (jabon, shampoo, acond.)', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 25000 },
  { name: 'Set de baño (escobilla, basurero)', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 30000 },
  { name: 'Porta Toallas', category: Category.BATHROOMS, relevance: Relevance.MEDIUM, price: 20000 },
  { name: 'Salida de ducha', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 15000 },
  { name: 'Antideslizante ducha', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 10000 },
  { name: 'Cortina de baño y forro', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 20000 },
  { name: 'Sopapo', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 5000 },
  // OTROS
  { name: 'Aspiradora', category: Category.OTHER, relevance: Relevance.MEDIUM, price: 100000 },
  { name: 'Set de ampolletas LED', category: Category.OTHER, relevance: Relevance.HIGH, price: 25000 },
  { name: 'Arrimo para entrada', category: Category.OTHER, relevance: Relevance.LOW, price: 70000 },
  { name: 'Espejo cuerpo completo', category: Category.OTHER, relevance: Relevance.LOW, price: 50000 },
  { name: 'Set de herramientas básico', category: Category.OTHER, relevance: Relevance.MEDIUM, price: 30000 },
  { name: 'Alargador / Zapatilla eléctrica (x3)', category: Category.OTHER, relevance: Relevance.HIGH, price: 15000 },
  // TERRAZA 1
  { name: 'Barra con 2 pisos', category: Category.TERRACE_1, relevance: Relevance.LOW, price: 120000 },
  // TERRAZA 2
  { name: 'Juego de terraza (2 sillas y mesa)', category: Category.TERRACE_2, relevance: Relevance.LOW, price: 150000 },
  { name: 'Planta decorativa', category: Category.TERRACE_2, relevance: Relevance.LOW, price: 30000 },
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Gemini Service
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
        relevance: { type: Type.STRING, enum: Object.values(Relevance), description: "Relevancia del item." },
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
const Loader: React.FC<{ size?: string }> = ({ size = 'h-5 w-5' }) => {
  return (
    <svg
      className={`animate-spin text-current ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

const Header: React.FC = () => {
  return (
    <header className="flex items-center gap-3 mb-6">
      <HouseIcon className="w-8 h-8 text-green-600" />
      <h1 className="text-3xl font-bold text-slate-800">
        Amoblando Nuestra Casa
      </h1>
    </header>
  );
};

interface UserSwitcherProps {
  activeUser: User;
  onUserChange: (user: User) => void;
}
const UserSwitcher: React.FC<UserSwitcherProps> = ({ activeUser, onUserChange }) => {
  return (
    <div className="flex w-full max-w-sm mx-auto p-1 bg-slate-200 rounded-full my-6">
      <button
        onClick={() => onUserChange(User.FELIPE)}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full font-semibold transition-all duration-300 ${
          activeUser === User.FELIPE
            ? 'bg-indigo-600 text-white shadow'
            : 'bg-transparent text-slate-600 hover:bg-slate-200'
        }`}
      >
        <UserIcon className="w-5 h-5" /> {User.FELIPE}
      </button>
      <button
        onClick={() => onUserChange(User.VALERIA)}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-full font-semibold transition-all duration-300 ${
          activeUser === User.VALERIA
            ? 'bg-red-500 text-white shadow'
            : 'bg-transparent text-slate-600 hover:bg-slate-200'
        }`}
      >
        <UserIcon className="w-5 h-5" /> {User.VALERIA}
      </button>
    </div>
  );
};

interface StatCardProps {
  bgColor?: string;
  children: React.ReactNode;
}
const StatCard: React.FC<StatCardProps> = ({ bgColor = 'bg-slate-100', children }) => {
  return (
    <div className={`p-4 rounded-xl ${bgColor}`}>
      {children}
    </div>
  );
};

interface DashboardStats {
  progress: { completed: number; total: number };
  budget: { total: number; spent: number; remaining: number };
  relevance: { high: number; medium: number; low: number };
}
interface DashboardProps {
  stats: DashboardStats;
}
const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
    const formatCurrency = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard bgColor="bg-blue-50">
        <h3 className="text-sm font-medium text-blue-800">Progreso General</h3>
        <p className="text-3xl font-bold text-blue-900 mt-1">{stats.progress.completed} / {stats.progress.total}</p>
        <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{width: `${stats.progress.total > 0 ? (stats.progress.completed / stats.progress.total) * 100 : 0}%`}}
          ></div>
        </div>
      </StatCard>
      <StatCard bgColor="bg-green-50">
        <h3 className="text-sm font-medium text-green-800">Presupuesto</h3>
        <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(stats.budget.spent)} / {formatCurrency(stats.budget.total)}</p>
        <p className="text-sm text-green-600 mt-1">Resta: {formatCurrency(stats.budget.remaining)}</p>
      </StatCard>
      <StatCard bgColor="bg-yellow-50">
        <h3 className="text-sm font-medium text-yellow-800">Relevancia</h3>
        <div className="flex justify-around items-center mt-2">
            <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">{stats.relevance.high}</p>
                <p className="text-xs text-red-500 font-medium">Alta</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">{stats.relevance.medium}</p>
                <p className="text-xs text-yellow-600 font-medium">Media</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">{stats.relevance.low}</p>
                <p className="text-xs text-blue-500 font-medium">Baja</p>
            </div>
        </div>
      </StatCard>
    </div>
  );
};

interface CategoryProgressData {
    name: string;
    icon: React.FC<{ className?: string }>;
    completed: number;
    total: number;
    felipe: number;
    valeria: number;
}
interface CategoryProgressProps {
    stats: CategoryProgressData[];
}
const CategoryProgress: React.FC<CategoryProgressProps> = ({ stats }) => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Progreso por Espacio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {stats.map(stat => {
                    const percentage = stat.total > 0 ? (stat.completed / stat.total) * 100 : 0;
                    const Icon = stat.icon;
                    return (
                        <div key={stat.name}>
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    <Icon className="w-5 h-5 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">{stat.name}</span>
                                </div>
                                <span className="text-sm font-medium text-slate-500">{stat.completed} / {stat.total}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center text-xs mt-1.5 text-slate-500 px-1">
                                <div className="flex items-center gap-1.5">
                                    <UserIcon className="w-3 h-3 text-indigo-500" />
                                    <span>Felipe: <strong>{stat.felipe}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <UserIcon className="w-3 h-3 text-red-500" />
                                    <span>Valeria: <strong>{stat.valeria}</strong></span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


interface CategorySelectorProps {
  selectedCategory: Category | null;
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
          aria-activedescendant={selectedCategory || undefined}
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

interface AddItemFormProps {
  onAddItem: (item: Omit<Item, 'id' | 'completed' | 'completedBy'>) => void;
}
const AddItemForm: React.FC<AddItemFormProps> = ({ onAddItem }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [relevance, setRelevance] = useState<Relevance>(Relevance.MEDIUM);
  const [price, setPrice] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && price.trim() && category) {
      onAddItem({
        name: name.trim(),
        category,
        relevance,
        price: Number(price),
      });
      setName('');
      setPrice('');
      setCategory(null);
      setRelevance(Relevance.MEDIUM);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/[^\d]/g, '');
    setPrice(numericValue);
  };

  const formattedPrice = price ? new Intl.NumberFormat('es-CL').format(Number(price)) : '';
  const isFormValid = name.trim() !== '' && price.trim() !== '' && category !== null;

  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-700 mb-4">
        <PlusIcon className="w-5 h-5" />
        Agregar Item Manualmente
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="item-name" className="block text-sm font-medium text-slate-600 mb-1">Nombre del Item *</label>
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
          <label htmlFor="item-category" className="block text-sm font-medium text-slate-600 mb-1">Espacio / Categoría *</label>
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
         <div className='md:col-span-2'>
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
            disabled={!isFormValid}
            className="w-full py-3 bg-violet-400 text-white font-semibold rounded-lg shadow-md hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition duration-200 disabled:bg-violet-300 disabled:cursor-not-allowed"
          >
            Agregar
          </button>
        </div>
      </form>
    </div>
  );
};


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

interface FiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}
const FilterButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  count: number;
  children?: React.ReactNode;
}> = ({ label, isActive, onClick, count, children }) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    }`}
  >
    {children}
    {label} ({count || 0})
  </button>
);
const Filters: React.FC<FiltersProps> = ({ activeFilter, onFilterChange, counts, searchQuery, onSearchChange }) => {
  const staticFilters = ['Todos', 'Pendientes', 'Completados'];
  const filtersRef = useRef<HTMLDivElement>(null);

  const handleWheel = (event: React.WheelEvent) => {
    if (filtersRef.current) {
        if(filtersRef.current.scrollWidth > filtersRef.current.clientWidth) {
            event.preventDefault();
            filtersRef.current.scrollLeft += event.deltaY;
        }
    }
  };


  return (
    <div className="flex flex-col gap-4 pb-4">
      <div 
        ref={filtersRef}
        onWheel={handleWheel}
        className="flex items-center gap-2 w-full overflow-x-auto pb-2 md:flex-wrap md:overflow-visible"
        style={{ scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}
      >
        {staticFilters.map(filter => (
          <FilterButton
            key={filter}
            label={filter}
            isActive={activeFilter === filter}
            onClick={() => onFilterChange(filter)}
            count={counts[filter]}
          />
        ))}
        <div className="h-6 w-px bg-slate-200 mx-2 flex-shrink-0"></div>
        {CATEGORIES.map(cat => (
          <FilterButton
            key={cat.id}
            label={cat.name}
            isActive={activeFilter === cat.id}
            onClick={() => onFilterChange(cat.id)}
            count={counts[cat.id]}
          >
            <cat.icon className="w-4 h-4" />
          </FilterButton>
        ))}
      </div>
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar item..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full block pl-10 pr-3 py-2 bg-slate-100 border border-transparent rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};


interface ItemProps {
  item: Item;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdatePrice: (id: string, newPrice: number) => void;
}
const ItemComponent: React.FC<ItemProps> = ({ item, onToggle, onDelete, onUpdatePrice }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newPrice, setNewPrice] = useState(item.price.toString());

  const categoryInfo = CATEGORIES.find(c => c.id === item.category);
  const relevanceInfo = RELEVANCE_STYLES[item.relevance];
  const formattedPrice = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(item.price);
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = rawValue.replace(/[^\d]/g, '');
    setNewPrice(numericValue);
  };
  
  const formattedNewPrice = newPrice ? new Intl.NumberFormat('es-CL').format(Number(newPrice)) : '';

  const handleSave = () => {
    const priceNumber = Number(newPrice);
    if (!isNaN(priceNumber) && priceNumber >= 0) {
        onUpdatePrice(item.id, priceNumber);
        setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewPrice(item.price.toString());
  };

  return (
    <div className={`flex items-center justify-between bg-slate-50 p-3 rounded-lg transition-all duration-300 ${item.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-4 flex-grow">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={() => onToggle(item.id)}
          className="h-6 w-6 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
        <div className="flex-grow">
          <p className={`font-medium ${item.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
            {item.name}
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1 flex-wrap">
            <div className="flex items-center gap-1">
                {categoryInfo && <categoryInfo.icon className="w-4 h-4" />}
                <span>{item.category}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${relevanceInfo.dot}`}></span>
                <span>{item.relevance}</span>
            </div>
            {item.completed && item.completedBy && (
                <div className="flex items-center gap-1.5">
                    <CheckIcon className={`w-4 h-4 ${item.completedBy === User.FELIPE ? 'text-indigo-500' : 'text-red-500'}`} />
                    <span>{item.completedBy}</span>
                </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {isEditing ? (
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 sm:text-sm">$</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={formattedNewPrice}
              onChange={handlePriceChange}
              className="w-28 pl-7 pr-2 py-1 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
        ) : (
          <p className={`font-semibold text-slate-700 w-28 text-right ${item.completed ? 'line-through' : ''}`}>{formattedPrice}</p>
        )}
        <div className="flex items-center">
            {isEditing ? (
            <>
                <button
                onClick={handleSave}
                className="text-slate-400 hover:text-green-500 transition-colors duration-200 p-1 rounded-full"
                aria-label={`Guardar precio de ${item.name}`}
                >
                <CheckIcon className="w-5 h-5" />
                </button>
                <button
                onClick={handleCancel}
                className="text-slate-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full"
                aria-label={`Cancelar edición de ${item.name}`}
                >
                <XIcon className="w-5 h-5" />
                </button>
            </>
            ) : (
            <>
                <button
                onClick={() => {
                    setIsEditing(true);
                    setNewPrice(item.price.toString());
                }}
                className="text-slate-400 hover:text-indigo-500 transition-colors duration-200 p-1 rounded-full"
                aria-label={`Editar ${item.name}`}
                >
                <PencilIcon className="w-5 h-5" />
                </button>
                <button
                onClick={() => onDelete(item.id)}
                className="text-slate-400 hover:text-red-500 transition-colors duration-200 p-1 rounded-full"
                aria-label={`Eliminar ${item.name}`}
                >
                <TrashIcon className="w-5 h-5" />
                </button>
            </>
            )}
        </div>
      </div>
    </div>
  );
};

interface ItemListProps {
  items: Item[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdatePrice: (id: string, newPrice: number) => void;
}
const ItemList: React.FC<ItemListProps> = ({ items, onToggle, onDelete, onUpdatePrice }) => {
  if (items.length === 0) {
    return (
        <div className="text-center py-12">
            <div className="inline-block bg-slate-100 p-4 rounded-full mb-4">
                <SearchIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700">No se encontraron items</h3>
            <p className="text-slate-500 mt-2">
                Prueba con otra búsqueda o cambia el filtro.
            </p>
        </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {items.map((item) => (
        <ItemComponent
          key={item.id}
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdatePrice={onUpdatePrice}
        />
      ))}
    </div>
  );
};


// =================================================================================
// --- MAIN APP COMPONENT ---
// =================================================================================
const App: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [budget, setBudget] = useState(5000000); // Presupuesto de ejemplo
  const [activeUser, setActiveUser] = useState<User>(User.FELIPE);
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  const itemsCollectionRef = useMemo(() => collection(db, "items"), []);

  useEffect(() => {
    setLoading(true);
    const q = query(itemsCollectionRef, orderBy("name", "asc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const itemsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Item, 'id'>),
        }));
        
        const typedItems: Item[] = itemsData.map(item => ({
            ...item,
            category: item.category as Category,
            relevance: item.relevance as Relevance,
            completedBy: item.completedBy || null,
        }));

        setItems(typedItems);
        setLoading(false);
    }, (error) => {
        console.error("Error al obtener items de Firestore: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [itemsCollectionRef]);

  const handleAddItem = useCallback(async (newItem: Omit<Item, 'id' | 'completed' | 'completedBy'>) => {
    try {
      await addDoc(itemsCollectionRef, { ...newItem, completed: false, completedBy: null });
    } catch (error) {
        console.error("Error al agregar documento: ", error);
    }
  }, [itemsCollectionRef]);

  const handleAddSuggestedItem = useCallback((suggestedItem: SuggestedItem) => {
    handleAddItem({
      name: suggestedItem.name,
      category: suggestedItem.category,
      relevance: suggestedItem.relevance,
      price: suggestedItem.price
    });
  }, [handleAddItem]);
  
  const handleToggleItem = useCallback(async (id: string) => {
    const itemToToggle = items.find(item => item.id === id);
    if (!itemToToggle) {
        console.error("Item no encontrado para cambiar estado");
        return;
    }
    const itemDoc = doc(db, "items", id);
    try {
        const isNowCompleted = !itemToToggle.completed;
        await updateDoc(itemDoc, { 
            completed: isNowCompleted,
            completedBy: isNowCompleted ? activeUser : null 
        });
    } catch(error) {
        console.error("Error al actualizar documento: ", error);
    }
  }, [items, activeUser]);

  const handleDeleteItem = useCallback(async (id: string) => {
    const itemDoc = doc(db, "items", id);
    try {
        await deleteDoc(itemDoc);
    } catch(error) {
        console.error("Error al eliminar documento: ", error);
    }
  }, []);

  const handleUpdateItemPrice = useCallback(async (id: string, newPrice: number) => {
    const itemDoc = doc(db, "items", id);
    try {
        await updateDoc(itemDoc, { price: newPrice });
    } catch(error) {
        console.error("Error al actualizar precio del documento: ", error);
    }
  }, []);

  const handleSeedData = useCallback(async () => {
    if (items.length > 0) {
      console.warn("La base de datos no está vacía. Carga de datos iniciales abortada.");
      return;
    }
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      const itemsCollection = collection(db, "items");
      initialItems.forEach((item) => {
        const docRef = doc(itemsCollection); 
        batch.set(docRef, { ...item, completed: false, completedBy: null });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error al cargar datos iniciales: ", error);
    } finally {
      setIsSeeding(false);
    }
  }, [items.length]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const completedItems = items.filter(item => item.completed).length;
    const spent = items.filter(item => item.completed).reduce((sum, item) => sum + item.price, 0);
    const relevanceCounts = items.reduce((acc, item) => {
        acc[item.relevance] = (acc[item.relevance] || 0) + 1;
        return acc;
    }, {} as Record<Relevance, number>);

    return {
      progress: { completed: completedItems, total: totalItems },
      budget: { total: budget, spent: spent, remaining: budget - spent },
      relevance: {
        high: relevanceCounts[Relevance.HIGH] || 0,
        medium: relevanceCounts[Relevance.MEDIUM] || 0,
        low: relevanceCounts[Relevance.LOW] || 0,
      }
    };
  }, [items, budget]);
  
  const categoryProgressStats = useMemo(() => {
    const statsByCategory = CATEGORIES.reduce((acc, category) => {
        acc[category.id] = {
            completed: 0,
            total: 0,
            name: category.name,
            icon: category.icon,
            felipe: 0,
            valeria: 0,
        };
        return acc;
    }, {} as Record<Category, { completed: number; total: number; name: string; icon: React.FC<{className?: string}>; felipe: number; valeria: number; }>);

    items.forEach(item => {
        if (statsByCategory[item.category]) {
            statsByCategory[item.category].total += 1;
            if (item.completed) {
                statsByCategory[item.category].completed += 1;
                if (item.completedBy === User.FELIPE) {
                    statsByCategory[item.category].felipe += 1;
                } else if (item.completedBy === User.VALERIA) {
                    statsByCategory[item.category].valeria += 1;
                }
            }
        }
    });

    return Object.values(statsByCategory);
  }, [items]);
  
  const filteredItems = useMemo(() => {
    let itemsToFilter = items;

    if (activeFilter === 'Pendientes') {
        itemsToFilter = items.filter(item => !item.completed);
    } else if (activeFilter === 'Completados') {
        itemsToFilter = items.filter(item => item.completed);
    } else if (activeFilter !== 'Todos') {
        itemsToFilter = items.filter(item => item.category === activeFilter);
    }

    if (searchQuery.trim() !== '') {
        itemsToFilter = itemsToFilter.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    return itemsToFilter;
  }, [items, activeFilter, searchQuery]);
  
  const filterCounts = useMemo(() => {
    const categoryCounts = items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
    }, {} as Record<Category, number>);

    return {
        'Todos': items.length,
        'Pendientes': items.filter(item => !item.completed).length,
        'Completados': items.filter(item => item.completed).length,
        ...categoryCounts
    };
  }, [items]);


  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        <UserSwitcher activeUser={activeUser} onUserChange={setActiveUser} />
        
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 my-6">
          <Dashboard stats={stats} />
          <hr className="my-6 border-slate-200" />
          <CategoryProgress stats={categoryProgressStats} />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 my-6">
          <AddItemForm onAddItem={handleAddItem} />
          <hr className="my-6 border-slate-200" />
          <SuggestionsSection onAddSuggested={handleAddSuggestedItem}/>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 my-6">
           <Filters 
             activeFilter={activeFilter} 
             onFilterChange={setActiveFilter}
             counts={filterCounts}
             searchQuery={searchQuery}
             onSearchChange={setSearchQuery}
            />
           {loading ? (
             <div className="flex justify-center items-center py-12">
               <Loader size="h-10 w-10 text-indigo-500" />
             </div>
           ) : items.length === 0 ? (
             <div className="text-center py-12">
                <div className="inline-block bg-slate-100 p-4 rounded-full mb-4">
                    <OtherIcon className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700">Tu lista está vacía</h3>
                <p className="text-slate-500 mt-2">
                    Agrega un item para empezar a planificar.
                </p>
                <div className="mt-6">
                  <p className="text-slate-500 mb-4">O si lo prefieres, puedes empezar con nuestra lista sugerida.</p>
                  <button
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-200 disabled:bg-green-300"
                  >
                    {isSeeding && <Loader size="h-5 w-5" />}
                    {isSeeding ? 'Cargando...' : 'Cargar lista inicial'}
                  </button>
                </div>
             </div>
           ) : (
             <ItemList 
               items={filteredItems}
               onToggle={handleToggleItem}
               onDelete={handleDeleteItem}
               onUpdatePrice={handleUpdateItemPrice}
             />
           )}
        </div>
      </div>
    </div>
  );
};


// =================================================================================
// --- RENDER ---
// =================================================================================
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
