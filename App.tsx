import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { Item, SuggestedItem } from './types';
import { User, Relevance, Category } from './types';
import Header from './components/Header';
import UserSwitcher from './components/UserSwitcher';
import Dashboard from './components/Dashboard';
import AddItemForm from './components/FormularioAgregarItem';
import SuggestionsSection from './components/SuggestionsSection';
import Filters from './components/Filters';
import ItemList from './components/ListaCompras';
import { db } from './services/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import Loader from './components/Loader';
import { initialItems as seedData } from './initialData';
import OtherIcon from './components/icons/OtherIcon';


const App: React.FC = () => {
  const [activeUser, setActiveUser] = useState<User>(User.FELIPE);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [budget, setBudget] = useState(5000000); // Presupuesto de ejemplo

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
        }));

        setItems(typedItems);
        setLoading(false);
    }, (error) => {
        console.error("Error al obtener items de Firestore: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [itemsCollectionRef]);

  const handleAddItem = useCallback(async (newItem: Omit<Item, 'id' | 'completed'>) => {
    try {
      await addDoc(itemsCollectionRef, { ...newItem, completed: false });
    } catch (error) {
        console.error("Error al agregar documento: ", error);
    }
  }, [itemsCollectionRef]);

  const handleAddSuggestedItem = useCallback((suggestedItem: SuggestedItem) => {
    const newItem: Omit<Item, 'id' | 'completed'> = {
      name: suggestedItem.name,
      category: suggestedItem.category,
      relevance: suggestedItem.relevance,
      price: suggestedItem.price,
    };
    handleAddItem(newItem);
  }, [handleAddItem]);
  
  const handleToggleItem = useCallback(async (id: string) => {
    const itemToToggle = items.find(item => item.id === id);
    if (!itemToToggle) {
        console.error("Item no encontrado para cambiar estado");
        return;
    }
    const itemDoc = doc(db, "items", id);
    try {
        await updateDoc(itemDoc, { completed: !itemToToggle.completed });
    } catch(error) {
        console.error("Error al actualizar documento: ", error);
    }
  }, [items]);

  const handleDeleteItem = useCallback(async (id: string) => {
    const itemDoc = doc(db, "items", id);
    try {
        await deleteDoc(itemDoc);
    } catch(error) {
        console.error("Error al eliminar documento: ", error);
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
      seedData.forEach(item => {
        const docRef = doc(itemsCollection); // Crea una referencia con un ID nuevo y auto-generado
        batch.set(docRef, { ...item, completed: false });
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
  
  const [activeFilter, setActiveFilter] = useState<string>('Todos');

  const filteredItems = useMemo(() => {
    if (activeFilter === 'Todos') return items;
    if (activeFilter === 'Pendientes') return items.filter(item => !item.completed);
    if (activeFilter === 'Completados') return items.filter(item => item.completed);
    return items.filter(item => item.category === activeFilter);
  }, [items, activeFilter]);
  
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
             />
           )}
        </div>
      </div>
    </div>
  );
};

export default App;