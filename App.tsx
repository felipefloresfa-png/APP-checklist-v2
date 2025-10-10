import * as React from 'react';
import { getFirestore, collection, onSnapshot, query, orderBy, doc, setDoc, addDoc, updateDoc, writeBatch, serverTimestamp, getDoc, getDocs, where, deleteField } from 'firebase/firestore';

import { db } from './services/firebase.ts';
import { Item, User, Category, Relevance } from './types.ts';
import { initialItems } from './initialData.ts';

import Header from './components/Header.tsx';
import Dashboard from './components/Dashboard.tsx';
import AddItemForm from './components/FormularioAgregarItem.tsx';
import Filters from './components/Filters.tsx';
import ListaCompras from './components/ListaCompras.tsx';
import Loader from './components/Loader.tsx';
import UserSwitcher from './components/UserSwitcher.tsx';
import ActividadReciente from './components/ActividadReciente.tsx';
import ProgresoEspacio from './components/ProgresoEspacio.tsx';
import CategoryItemsModal from './components/CategoryItemsModal.tsx';
import EditItemModal from './components/EditItemModal.tsx';
import ConfirmationModal from './components/ConfirmationModal.tsx';
import ShareButton from './components/ShareButton.tsx';

function App() {
    const initialItemsState: Item[] = [];
    const [items, setItems] = React.useState(initialItemsState);
    const [currentUser, setCurrentUser] = React.useState<User>(User.FELIPE);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [totalBudget, setTotalBudget] = React.useState(0);

    const [filterCategory, setFilterCategory] = React.useState<Category | 'all'>('all');
    const [filterRelevance, setFilterRelevance] = React.useState<Relevance | 'all'>('all');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterStatus, setFilterStatus] = React.useState<'all' | 'pending' | 'completed'>('all');

    const [categoryModal, setCategoryModal] = React.useState<Category | null>(null);
    const [editingItem, setEditingItem] = React.useState<Item | null>(null);
    const [deletingItem, setDeletingItem] = React.useState<Item | null>(null);
    
    const itemsCollection = collection(db, 'items');
    const metadataDoc = doc(db, '_metadata', 'budget');
    
    React.useEffect(() => {
        const runMigration = async () => {
            const migrationDocRef = doc(db, '_metadata', 'migration_v3_completed_quantity_final_fix');
            const migrationDocSnap = await getDoc(migrationDocRef);

            if (!migrationDocSnap.exists()) {
                console.log("Ejecutando FIX FINAL para migración de 'completed: boolean' a 'completedQuantity: number'...");
                try {
                    const itemsToMigrateQuery = query(itemsCollection, where("completed", "==", true));
                    const querySnapshot = await getDocs(itemsToMigrateQuery);
                    
                    if (querySnapshot.empty) {
                        console.log("No se encontraron ítems con formato antiguo para corregir. Marcando la migración como completa.");
                        await setDoc(migrationDocRef, { completedAt: serverTimestamp(), note: "No items needed migration." });
                        return;
                    }

                    const batch = writeBatch(db);
                    console.log(`Se encontraron ${querySnapshot.size} ítems para la corrección final...`);

                    querySnapshot.forEach(document => {
                        const item = document.data() as Item & { completed?: boolean };
                        batch.update(document.ref, { 
                            completedQuantity: item.quantity || 1, // FIX: Default to 1 if quantity is missing
                            completed: deleteField()
                        });
                    });
                    
                    batch.set(migrationDocRef, { completedAt: serverTimestamp() });
                    
                    await batch.commit();
                    console.log("Corrección final de la migración completada exitosamente.");

                } catch (e: any) {
                    console.error("Error crítico durante la corrección final de la migración. El progreso antiguo podría no restaurarse.", e.message);
                }
            }
        };

        const seedDatabase = async () => {
            console.log("Colección vacía detectada. Precargando base de datos con ítems iniciales...");
            const batch = writeBatch(db);
            initialItems.forEach(item => {
                const docRef = doc(itemsCollection); 
                batch.set(docRef, {
                    ...item,
                    completedQuantity: 0,
                    createdAt: serverTimestamp(),
                    addedBy: User.FELIPE, // Se asigna un usuario por defecto
                });
            });
            try {
                await batch.commit();
                console.log("Base de datos precargada exitosamente!");
            } catch (e: any) {
                console.error("Error al precargar la base de datos: ", e.message);
                alert("No se pudo inicializar la lista de compras. Por favor, revisa tu conexión y refresca la página.");
            }
        };

        let unsubscribeItems: (() => void) | undefined;
        let unsubscribeBudget: (() => void) | undefined;

        const initializeApp = async () => {
            await runMigration();

            unsubscribeItems = onSnapshot(query(itemsCollection, orderBy('createdAt', 'desc')), (snapshot) => {
                if (loading && snapshot.empty) {
                    seedDatabase();
                }

                const itemsData = snapshot.docs.map(doc => {
                    const data = doc.data({ serverTimestamps: 'estimate' });
                    return {
                        id: doc.id,
                        name: data.name,
                        category: data.category,
                        relevance: data.relevance,
                        price: data.price,
                        quantity: data.quantity,
                        completedQuantity: data.completedQuantity || 0,
                        completedBy: data.completedBy || null,
                        createdAt: data.createdAt?.toDate() || null,
                        completedAt: data.completedAt?.toDate() || null,
                        addedBy: data.addedBy,
                        deleted: data.deleted || false,
                        deletedBy: data.deletedBy || null,
                        deletedAt: data.deletedAt?.toDate() || null,
                    } as Item;
                });
                setItems(itemsData);
                setLoading(false);
            }, (err: any) => {
                console.error("Firestore error:", err.message);
                setError("No se pudo conectar a la base de datos.");
                setLoading(false);
            });
            
            unsubscribeBudget = onSnapshot(metadataDoc, (doc) => {
                if (doc.exists()) {
                    setTotalBudget(doc.data().value || 5000000);
                } else {
                    setTotalBudget(5000000);
                }
            });
        };
        
        initializeApp();

        return () => {
            if (unsubscribeItems) unsubscribeItems();
            if (unsubscribeBudget) unsubscribeBudget();
        };
    }, []);


    const filteredItems = React.useMemo(() => {
        return items.filter(item => {
            if (item.deleted) return false; // Filter out soft-deleted items

            const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
            const matchesRelevance = filterRelevance === 'all' || item.relevance === filterRelevance;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            const isCompleted = item.completedQuantity === item.quantity;
            const matchesStatus =
                filterStatus === 'all' ||
                (filterStatus === 'pending' && !isCompleted) ||
                (filterStatus === 'completed' && isCompleted);

            return matchesCategory && matchesRelevance && matchesSearch && matchesStatus;
        });
    }, [items, filterCategory, filterRelevance, searchTerm, filterStatus]);

    const sortedItems = React.useMemo(() => {
        return [...filteredItems].sort((a, b) => {
             const aIsCompleted = a.completedQuantity === a.quantity;
             const bIsCompleted = b.completedQuantity === b.quantity;
             if (aIsCompleted && !bIsCompleted) return 1;
             if (!aIsCompleted && bIsCompleted) return -1;
             const relevanceOrder = { [Relevance.HIGH]: 0, [Relevance.MEDIUM]: 1, [Relevance.LOW]: 2 };
             return relevanceOrder[a.relevance] - relevanceOrder[b.relevance];
        });
    }, [filteredItems]);
    
    const handleAddMultipleItems = async (itemsToAdd: Omit<Item, 'id' | 'completedQuantity'>[]) => {
        if (itemsToAdd.length === 0) return;

        const batch = writeBatch(db);
        itemsToAdd.forEach(item => {
            const docRef = doc(itemsCollection);
            batch.set(docRef, {
                ...item,
                completedQuantity: 0,
                createdAt: serverTimestamp(),
            });
        });
        try {
            await batch.commit();
        } catch (e: any) {
             console.error("Error adding multiple items: ", e.message);
             alert('No se pudieron agregar los artículos. Por favor, revisa tu conexión e inténtalo de nuevo.');
        }
    };
    
    const handleUpdateCompletion = async (id: string, newCompletedQuantity: number) => {
        const itemRef = doc(db, 'items', id);
        const item = items.find(i => i.id === id);
        if (!item) return;
    
        const updates: any = {
            completedQuantity: newCompletedQuantity,
        };
    
        const isNowComplete = newCompletedQuantity >= item.quantity;
        const wasComplete = item.completedQuantity === item.quantity;
    
        if (isNowComplete && !wasComplete) {
            updates.completedBy = currentUser;
            updates.completedAt = serverTimestamp();
        } else if (!isNowComplete && wasComplete) {
            updates.completedBy = null;
            updates.completedAt = null;
        }
    
        try {
            await updateDoc(itemRef, updates);
        } catch (error: any) {
            console.error("Error al actualizar la completitud del item:", error.message);
            alert('No se pudo actualizar el artículo. Por favor, revisa tu conexión e inténtalo de nuevo.');
        }
    };

    const handleDeleteItem = (id: string) => {
        const itemToDelete = items.find(item => item.id === id);
        if (itemToDelete) {
            setDeletingItem(itemToDelete);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;
        
        const itemToDelete = deletingItem;
        setDeletingItem(null); // Optimistically close the modal

        try {
            const itemRef = doc(db, 'items', itemToDelete.id);
            await updateDoc(itemRef, {
                deleted: true,
                deletedBy: currentUser,
                deletedAt: serverTimestamp(),
            });
        } catch (e: any) {
            console.error("Error deleting item: ", e.message);
            alert('No se pudo eliminar el artículo. Por favor, revisa tu conexión e inténtalo de nuevo.');
        }
    };
    
    const handleUpdateItem = async (id: string, updates: Partial<Omit<Item, 'id'>>) => {
        const itemRef = doc(db, 'items', id);
        try {
            await updateDoc(itemRef, updates);
        } catch (e: any) {
            console.error("Error updating item: ", e.message);
            throw e;
        }
    };

    const handleUpdateBudget = async (newBudget: number) => {
        try {
            await setDoc(metadataDoc, { value: newBudget });
        } catch (e: any) {
            console.error("Error updating budget: ", e.message);
            alert('No se pudo actualizar el presupuesto. Por favor, revisa tu conexión e inténtalo de nuevo.');
        }
    };

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
            <Header />

            <div className="flex justify-center my-6">
                 <UserSwitcher currentUser={currentUser} onUserChange={setCurrentUser} />
            </div>

            <main className="space-y-6">
                <Dashboard items={items} totalBudget={totalBudget} onUpdateBudget={handleUpdateBudget} />
                
                <ActividadReciente items={items} />

                <ProgresoEspacio 
                    items={items} 
                    onOpenCategoryModal={setCategoryModal}
                />
                
                <AddItemForm onAddItems={handleAddMultipleItems} currentUser={currentUser} />
                
                <div className="bg-white p-4 rounded-xl shadow-md space-y-4">
                    <Filters 
                        items={items}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        filterRelevance={filterRelevance}
                        setFilterRelevance={setFilterRelevance}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                    />
                    <ShareButton items={items} />
                </div>


                <ListaCompras 
                    items={sortedItems}
                    loading={loading}
                    onUpdateCompletion={handleUpdateCompletion}
                    onDeleteItem={handleDeleteItem}
                    onStartEdit={setEditingItem}
                />
            </main>
            {categoryModal && (
                <CategoryItemsModal
                    category={categoryModal}
                    items={items.filter(item => item.category === categoryModal)}
                    onClose={() => setCategoryModal(null)}
                    onUpdateCompletion={handleUpdateCompletion}
                />
            )}
            {editingItem && (
                <EditItemModal
                    item={editingItem}
                    onClose={() => setEditingItem(null)}
                    onSave={handleUpdateItem}
                />
            )}
            <ConfirmationModal
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={handleConfirmDelete}
                item={deletingItem}
            />
        </div>
    );
}

export default App;