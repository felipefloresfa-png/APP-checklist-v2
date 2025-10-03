import { Category, Relevance } from './types';
import type { Item } from './types';


export const initialItems: Omit<Item, 'id' | 'completed'>[] = [
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