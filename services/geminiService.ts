import { GoogleGenAI, Type } from "@google/genai";
import { Category, Relevance } from '../types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface SuggestedItemResponse {
  name: string;
  relevance: Relevance;
  price: number;
}

export const getSuggestions = async (category: Category): Promise<SuggestedItemResponse[]> => {
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
    const result: unknown = JSON.parse(jsonString);

    if (Array.isArray(result)) {
      const validRelevances = Object.values(Relevance);
      return result.filter((item): item is SuggestedItemResponse => {
        return (
          typeof item === 'object' &&
          item !== null &&
          typeof item.name === 'string' &&
          typeof item.price === 'number' &&
          typeof item.relevance === 'string' &&
          validRelevances.includes(item.relevance as Relevance)
        );
      });
    }
    return [];
  } catch (error: any) {
    console.error("Error calling Gemini API:", error.message || String(error));
    throw new Error("No se pudieron obtener sugerencias de la IA.");
  }
};