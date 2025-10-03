import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
// FIX: Switched to Firebase v9 compat libraries to resolve initialization errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

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
  { name: 'Toallas de corpo (x4)', category: Category.BATHROOMS, relevance: Relevance.HIGH, price: 40000 },
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
// FIX: Updated Firebase initialization to use the compat syntax.
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const itemsCollection = db.collection('items');

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

const Dashboard: React.FC<{ items: Item[]; totalBudget: number; onUpdateBudget: (newBudget: number) => void; }> = ({ items, totalBudget, onUpdateBudget }) => {
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [editedBudget, setEditedBudget] = useState('');

    useEffect(() => {
        setEditedBudget(new Intl.NumberFormat('es-CL').format(totalBudget));
    }, [totalBudget]);

    const totalItems = items.length;
    const completedItems = items.filter(item => item.completed).length;
    const progress = totalItems > 0 ? (completedItems / totalItems) : 0;
    const completedCost = items.filter(item => item.completed).reduce((sum, item) => sum + item.price, 0);

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

    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Progreso General */}
            <div className="bg-[#EFF6FF] p-5 rounded-xl shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Progreso General</h3>
                <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-bold text-gray-800">{completedItems}</span>
                    <span className="text-2xl font-medium text-gray-400">/ {totalItems}</span>
                </div>
                <div className="mt-4 bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress * 100}%` }}></div>
                </div>
            </div>

            {/* Presupuesto */}
            <div className="bg-[#F0FDF4] p-5 rounded-xl shadow-sm">
                <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Presupuesto</h3>
                    {!isEditingBudget && (
                        <button onClick={() => setIsEditingBudget(true)} className="text-gray-400 hover:text-indigo-600 p-1 rounded-full hover:bg-green-100/50 -mt-1 -mr-1" aria-label="Editar presupuesto">
                            <PencilIcon className="h-4 w-4" />
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
                                className="w-full pl-7 pr-2 py-1 text-2xl font-bold text-green-800 bg-green-50/50 border border-green-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
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
                    <>
                        <p className="text-2xl font-bold text-green-800">${formatCurrency(completedCost)} / ${formatCurrency(totalBudget)}</p>
                        <p className="text-sm font-medium text-gray-600 mt-2">Resta: ${formatCurrency(totalBudget - completedCost)}</p>
                    </>
                )}
            </div>

            {/* Relevancia */}
            <div className="bg-[#FEFCE8] p-5 rounded-xl shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Relevancia</h3>
                <div className="flex justify-around items-center text-center">
                    <div>
                        <p className="text-3xl font-bold text-red-500">
                           {relevanceStats[Relevance.HIGH].completed}<span className="text-2xl font-normal text-gray-400">/{relevanceStats[Relevance.HIGH].total}</span>
                        </p>
                        <p className="text-xs font-semibold text-red-500">Alta</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-yellow-500">
                            {relevanceStats[Relevance.MEDIUM].completed}<span className="text-2xl font-normal text-gray-400">/{relevanceStats[Relevance.MEDIUM].total}</span>
                        </p>
                        <p className="text-xs font-semibold text-yellow-500">Media</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-blue-500">
                             {relevanceStats[Relevance.LOW].completed}<span className="text-2xl font-normal text-gray-400">/{relevanceStats[Relevance.LOW].total}</span>
                        </p>
                        <p className="text-xs font-semibold text-blue-500">Baja</p>
                    </div>
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
        <section className="my-8">
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

const CategoryItemsModal: React.FC<{
    category: Category;
    items: Item[];
    onClose: () => void;
}> = ({ category, items, onClose }) => {
    const categoryInfo = CATEGORIES.find(c => c.id === category);
    const categoryItems = items.filter(item => item.category === category);
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

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
                        {categoryItems.length > 0 ? (
                            categoryItems.map(item => (
                                <li key={item.id} className={`flex justify-between items-center p-3 rounded-lg ${item.completed ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}>
                                    <div className="flex items-center space-x-3">
                                       <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center border-2 ${item.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                         {item.completed && <CheckIcon className="h-4 w-4 text-white" />}
                                       </div>
                                       <span className={`${item.completed ? 'line-through' : 'font-medium text-gray-700'}`}>
                                          {item.name}
                                       </span>
                                    </div>
                                    <span className={`font-semibold ${item.completed ? 'line-through' : 'text-gray-800'}`}>
                                        {formatCurrency(item.price)}
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


const EditItemModal: React.FC<{
    item: Item;
    onUpdate: (item: Item) => void;
    onClose: () => void;
}> = ({ item, onUpdate, onClose }) => {
    const [name, setName] = useState(item.name);
    const [price, setPrice] = useState(new Intl.NumberFormat('es-CL').format(item.price));
    const [category, setCategory] = useState<Category>(item.category);
    const [relevance, setRelevance] = useState<Relevance>(item.relevance);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && price && category) {
            onUpdate({
                ...item,
                name,
                price: parseInt(price.replace(/\./g, ''), 10),
                category,
                relevance
            });
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="editItemCategory" className="block text-sm font-medium text-gray-700">Espacio / Categoría *</label>
                            <select id="editItemCategory" value={category} onChange={(e) => setCategory(e.target.value as Category)} required
                                className="appearance-none mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                style={selectArrowStyle}
                            >
                                {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="editItemRelevance" className="block text-sm font-medium text-gray-700">Relevancia</label>
                            <select id="editItemRelevance" value={relevance} onChange={(e) => setRelevance(e.target.value as Relevance)}
                                className="appearance-none mt-1 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                style={selectArrowStyle}
                            >
                                {Object.values(Relevance).map(rel => <option key={rel} value={rel}>{rel}</option>)}
                            </select>
                        </div>
                    </div>
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
                    <button type="submit" className="w-full px-4 py-3 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">Guardar Cambios</button>
                </form>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
    itemName: string;
    actionText: string;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ itemName, actionText, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm m-4 text-center animate-scale-up">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Confirmar Acción</h2>
                <p className="text-gray-600 mb-6">
                    ¿Estás seguro de que quieres marcar <span className="font-semibold text-gray-900">"{itemName}"</span> como {actionText}?
                </p>
                <div className="flex justify-center space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 text-base font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};


const ItemCompra: React.FC<{
    item: Item;
    onToggleComplete: (id: string, completed: boolean, name: string) => void;
    onEdit: (item: Item) => void;
    onDelete: (id: string) => void;
}> = ({ item, onToggleComplete, onEdit, onDelete }) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    const handleToggle = () => {
        onToggleComplete(item.id, !item.completed, item.name);
    };

    const relevancePillStyles: Record<Relevance, string> = {
        [Relevance.HIGH]: 'bg-red-100 text-red-700',
        [Relevance.MEDIUM]: 'bg-yellow-100 text-yellow-700',
        [Relevance.LOW]: 'bg-green-100 text-green-700',
    };

    return (
        <li className="group flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-200">
            <button
                onClick={handleToggle}
                className={`flex-shrink-0 h-10 w-10 rounded-full mr-4 flex items-center justify-center border-2 transition-colors duration-300 ${item.completed ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                aria-label={item.completed ? `Marcar "${item.name}" como pendiente` : `Marcar "${item.name}" como completado`}
            >
                {item.completed && <CheckIcon className="h-6 w-6 text-white" />}
            </button>
            
            <div className={`flex-grow ${item.completed ? 'text-gray-400' : ''}`}>
                <p className={`font-semibold text-gray-800 ${item.completed ? 'line-through' : ''}`}>{item.name}</p>
                <div className="flex items-center space-x-2 text-sm mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${relevancePillStyles[item.relevance]}`}>
                        {item.relevance}
                    </span>
                </div>
            </div>

            <div className="ml-4 flex items-center space-x-2">
                 <p className={`font-bold text-lg ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {formatCurrency(item.price)}
                </p>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => onEdit(item)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-full" aria-label={`Editar ${item.name}`}>
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => onDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-full" aria-label={`Eliminar ${item.name}`}>
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </li>
    );
};

const FormularioAgregarItem: React.FC<{ onAddItem: (item: Omit<Item, 'id' | 'completed' | 'completedBy'>) => void; }> = ({ onAddItem }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState<Category | ''>('');
    const [relevance, setRelevance] = useState<Relevance>(Relevance.MEDIUM);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && price && category) {
            onAddItem({ name, price: parseInt(price.replace(/\./g, ''), 10), category, relevance });
            setName('');
            setPrice('');
            setCategory('');
            setRelevance(Relevance.MEDIUM);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                     <label htmlFor="itemPrice" className="block text-sm font-medium text-gray-700">Precio (CLP) *</label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-400 sm:text-sm">$</span>
                        </div>
                        <input
                            id="itemPrice"
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
                            placeholder="80.000"
                            className="w-full pl-7 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400"
                            required
                        />
                    </div>
                </div>
                <button type="submit" className="w-full px-4 py-3 text-base font-semibold text-gray-600 bg-violet-200 rounded-lg hover:bg-violet-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors">Agregar</button>
            </form>
        </div>
    );
};

const SuggestionsSection: React.FC<{ onAddSuggestion: (item: Omit<Item, 'id'|'completed'|'completedBy'>) => void }> = ({ onAddSuggestion }) => {
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
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
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
                            <button onClick={() => onAddSuggestion({...sug, category})} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-full" aria-label={`Agregar ${sug.name}`}>
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
}> = ({ activeCategory, setActiveCategory, statusFilter, setStatusFilter, relevanceFilters, setRelevanceFilters, categoryCounts }) => {
    
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
                        <span className="hidden sm:inline">{cat.name}</span>
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
            
            {/* Smart Filters Bar */}
            <div className="mt-4">
                 <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-sm font-bold text-gray-600 mr-1">Filtros:</span>
                     <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setStatusFilter('Pendientes')} className={`px-3 py-1 text-sm font-semibold rounded-full ${statusFilter === 'Pendientes' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Pendientes</button>
                        <button onClick={() => setStatusFilter('Completados')} className={`px-3 py-1 text-sm font-semibold rounded-full ${statusFilter === 'Completados' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Completados</button>
                        
                        <div className="h-4 w-px bg-gray-300 mx-1"></div>

                        {relevanceFilterConfig.map(rel => (
                            <button key={rel.id} onClick={() => handleRelevanceToggle(rel.id)} className={`px-3 py-1 text-sm font-semibold rounded-full ${relevanceFilters.has(rel.id) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {rel.label}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => { setStatusFilter('Todos'); setRelevanceFilters(new Set()); }} className={`ml-auto px-3 py-1 text-sm font-semibold rounded-full ${statusFilter === 'Todos' && relevanceFilters.size === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Ver Todos</button>
                 </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User>(User.FELIPE);
    const [totalBudget, setTotalBudget] = useState(5000000); // Default budget
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
    const [confirmingToggle, setConfirmingToggle] = useState<{ id: string; name: string; completed: boolean } | null>(null);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<'Pendientes' | 'Completados' | 'Todos'>('Pendientes');
    const [relevanceFilters, setRelevanceFilters] = useState<Set<Relevance>>(new Set());
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);

    useEffect(() => {
      const q = itemsCollection.orderBy('name');
      const unsubscribe = q.onSnapshot((querySnapshot) => {
        const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
        setItems(itemsData);
        setLoading(false);

        if (itemsData.length === 0) {
            const batch = db.batch();
            initialItems.forEach(item => {
                const docRef = db.collection('items').doc();
                batch.set(docRef, { ...item, completed: false, completedBy: null });
            });
            batch.commit();
        }
      });
      return () => unsubscribe();
    }, []);

    useEffect(() => {
        const budgetDocRef = db.collection('app_config').doc('budget');
        const unsubscribe = budgetDocRef.onSnapshot((doc) => {
            if (doc.exists) {
                setTotalBudget(doc.data()?.total || 5000000);
            } else {
                budgetDocRef.set({ total: 5000000 });
            }
        });
        return () => unsubscribe();
    }, []);

    const handleAddItem = async (item: Omit<Item, 'id' | 'completed' | 'completedBy'>) => {
        try {
            await itemsCollection.add({ ...item, completed: false, completedBy: null });
        } catch (error) {
            console.error("Error adding item: ", error);
        }
    };
    
    const handleToggleComplete = async (id: string, completed: boolean) => {
        const itemRef = db.collection('items').doc(id);
        try {
            await itemRef.update({
                completed: completed,
                completedBy: completed ? currentUser : null
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


    const handleUpdateBudget = async (newBudget: number) => {
        const budgetDocRef = db.collection('app_config').doc('budget');
        try {
            await budgetDocRef.set({ total: newBudget });
        } catch (error) {
            console.error("Error updating budget: ", error);
        }
    };

    const handleUpdateItem = async (updatedItem: Item) => {
        const { id, ...dataToUpdate } = updatedItem;
        const itemRef = db.collection('items').doc(id);
        try {
            await itemRef.update(dataToUpdate);
            setEditingItem(null); // Close modal
        } catch (error) {
            console.error("Error updating item: ", error);
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este item?')) {
            const itemRef = db.collection('items').doc(id);
            try {
                await itemRef.delete();
            } catch (error) {
                console.error("Error deleting item: ", error);
            }
        }
    };

    const preFilteredItems = useMemo(() => {
       return items
            .filter(item => {
                if (statusFilter === 'Pendientes') return !item.completed;
                if (statusFilter === 'Completados') return item.completed;
                return true;
            })
            .filter(item => {
                if (relevanceFilters.size === 0) return true;
                return relevanceFilters.has(item.relevance);
            });
    }, [items, statusFilter, relevanceFilters]);

    const filteredItems = useMemo(() => {
        return preFilteredItems.filter(item => {
                if (!activeCategory) return true;
                return item.category === activeCategory;
            });
    }, [preFilteredItems, activeCategory]);

    const categoryCounts = useMemo(() => {
        const counts = new Map<Category | null, number>();
        counts.set(null, preFilteredItems.length);
        CATEGORIES.forEach(cat => {
            const count = preFilteredItems.filter(item => item.category === cat.id).length;
            counts.set(cat.id, count);
        });
        return counts;
    }, [preFilteredItems]);
    
    return (
        <div className="min-h-screen">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                 <div className="flex justify-center items-center space-x-3 pt-6 pb-2">
                    <HouseIcon className="h-8 w-8 text-green-500" />
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Amoblando Nuestra Casa</h1>
                </div>
                 <div className="flex justify-center mb-6">
                    <UserSwitcher currentUser={currentUser} onUserChange={setCurrentUser} />
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm mt-8 border border-gray-200">
                    <Dashboard items={items} totalBudget={totalBudget} onUpdateBudget={handleUpdateBudget} />
                </div>
                
                <ProgressBySpace items={items} onCategoryClick={setViewingCategory} />

                <FormularioAgregarItem onAddItem={handleAddItem} />
                <SuggestionsSection onAddSuggestion={handleAddItem} />
                
                <Filters 
                  statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                  relevanceFilters={relevanceFilters} setRelevanceFilters={setRelevanceFilters}
                  activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                  categoryCounts={categoryCounts}
                />

                {loading ? (
                    <div className="flex justify-center items-center h-64"><Loader size="h-12 w-12" /></div>
                ) : (
                    <ul className="space-y-3 pb-8">
                        {filteredItems.map(item => (
                            <ItemCompra 
                                key={item.id}
                                item={item}
                                onToggleComplete={(id, completed, name) => setConfirmingToggle({ id, completed, name })}
                                onEdit={setEditingItem}
                                onDelete={handleDeleteItem}
                            />
                        ))}
                    </ul>
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
                    items={items}
                    onClose={() => setViewingCategory(null)}
                />
            )}
            {confirmingToggle && (
                <ConfirmationModal
                    itemName={confirmingToggle.name}
                    actionText={confirmingToggle.completed ? 'completado' : 'pendiente'}
                    onConfirm={handleConfirmToggle}
                    onCancel={() => setConfirmingToggle(null)}
                />
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