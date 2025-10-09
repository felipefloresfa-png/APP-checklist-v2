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
  completedQuantity: number;
  completedBy?: User | null;
  createdAt?: Date | null; 
  completedAt?: Date | null; 
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