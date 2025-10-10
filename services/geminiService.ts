import { Category, Relevance } from '../types.ts';

// Las funciones de IA han sido desactivadas para este proyecto.

export interface SuggestedItemResponse {
  name: string;
  relevance: Relevance;
  price: number;
}

export const getSuggestions = async (category: Category): Promise<SuggestedItemResponse[]> => {
  console.warn("Las sugerencias de IA están desactivadas.");
  return [];
};