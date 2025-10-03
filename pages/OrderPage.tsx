
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Table, OrderItem, TableStatus, Product } from '../types';
import NoteModal from '../components/NoteModal';
import { CloseIcon, TrashIcon, PlusIcon, UserIcon, MinusIcon, SearchIcon, DisketteIcon, BellIcon, PrinterIcon, XCircleIcon, ChevronLeftIcon, ListBulletIcon } from '../components/icons';

interface OrderPageProps {
  table: Table;
  products: Product[];
  onClose: () => void;
  onAddItem: (newItemData: Omit<OrderItem, 'id' | 'status'>, sourceItemId?: string) => void;
  onCommandAndClose: () => void;
  onPrintBill: () => void;
  onCloseTable: () => void;
  onRequestDeleteItem: (itemId: string, itemName: string) => void;
  onDecrementItem: (itemId: string) => void;
  onUpdateItemNote: (itemId: string, note: string) => void;
}

const getDisplayName = (name: string) => {
  return name.split(' - ')[0];
};

const OrderPage: React.FC<OrderPageProps> = ({ table, products, onClose, onAddItem, onCommandAndClose, onPrintBill, onCloseTable, onRequestDeleteItem, onDecrementItem, onUpdateItemNote }) => {
  const [activeGuest, setActiveGuest] = useState(1);
  const [isGuestSelectorOpen, setIsGuestSelectorOpen] = useState(false);
  const [isSummaryView, setIsSummaryView] = useState(false);
  const guestSelectorRef = useRef<HTMLDivElement>(null);
  
  const [filterQuery, setFilterQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [noteModalItem, setNoteModalItem] = useState<OrderItem | null>(null);

  // --- Swipe Gesture Logic ---
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const MIN_SWIPE_DISTANCE = 100;

  useEffect(() => {
    // Set the initial active guest to the highest existing guest number, or 1 for a new order.
    // This runs only once when the modal is opened.
    if (table.order.length > 0) {
      const maxGuest = Math.max(...table.order.map(item => item.guest || 1), 1);
      setActiveGuest(maxGuest);
    } else {
      setActiveGuest(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guestSelectorRef.current && !guestSelectorRef.current.contains(event.target as Node)) {
        setIsGuestSelectorOpen(false);
      }
    };
    if (isGuestSelectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGuestSelectorOpen]);


  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const swipeDistanceX = touchEndX - touchStartRef.current.x;
    const swipeDistanceY = touchEndY - touchStartRef.current.y;

    // Check for a predominantly horizontal swipe to the right
    if (swipeDistanceX > MIN_SWIPE_DISTANCE && Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY) * 1.5) {
      onClose();
    }
    
    touchStartRef.current = null;
  };
  
  const handleSaveNote = (note: string) => {
    if (noteModalItem) {
      onUpdateItemNote(noteModalItem.id, note);
    }
    setNoteModalItem(null);
  };

  const groupedOrder = useMemo(() => {
    return table.order.reduce((acc, item) => {
        const guestKey = item.guest || 1;
        if (!acc[guestKey]) {
            acc[guestKey] = [];
        }
        acc[guestKey].push(item);
        return acc;
    }, {} as Record<number, OrderItem[]>);
  }, [table.order]);
  
  const orderSummary = useMemo(() => {
    const summary: Record<string, { name: string; quantity: number }> = {};

    table.order.forEach(item => {
        if (summary[item.name]) {
            summary[item.name].quantity += item.quantity;
        } else {
            summary[item.name] = {
                name: item.name,
                quantity: item.quantity,
            };
        }
    });

    return Object.values(summary).sort((a, b) => a.name.localeCompare(b.name));
}, [table.order]);

  const maxGuestNumber = useMemo(() => Math.max(0, ...Object.keys(groupedOrder).map(Number)), [groupedOrder]);
  
  const handleSetActiveGuest = (guestNumber: number) => {
    setActiveGuest(guestNumber);
    setIsSummaryView(false); // Switch back to detail view when a guest is selected
  };
  
  const handleAddNewGuest = () => {
    const newGuestNumber = maxGuestNumber + 1;
    setActiveGuest(newGuestNumber);
    setIsSummaryView(false);
  };


  const handleSelectProduct = (product: Product) => {
      onAddItem({
        name: product.name,
        quantity: 1,
        price: product.price ?? 0,
        guest: activeGuest,
      });
      setFilteredProducts([]);
      setFilterQuery('');
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setFilterQuery(query);

    if (query.trim() === '') {
        setFilteredProducts([]);
        return;
    }

    const results = products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProducts(results);
  };
  
  const hasPendingItems = useMemo(() => table.order.some(item => item.status === 'pending'), [table.order]);
  const totalAmount = useMemo(() => table.order.reduce((sum, item) => sum + (item.quantity * item.price), 0), [table.order]);
  
  const highestGuest = Math.max(maxGuestNumber, activeGuest);
  const allGuestNumbers = Array.from({ length: highestGuest }, (_, i) => i + 1);

  return (
    <div 
        className="flex flex-col h-screen bg-gray-900 text-white"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
    >
        <NoteModal
            isOpen={!!noteModalItem}
            onClose={() => setNoteModalItem(null)}
            onSave={handleSaveNote}
            initialNote={noteModalItem?.note || ''}
            itemName={noteModalItem ? getDisplayName(noteModalItem.name) : ''}
        />
        <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex-1 flex justify-start">
                 <button onClick={onClose} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700">
                    <ChevronLeftIcon />
                    <span className="font-bold">Volver</span>
                </button>
            </div>
            <div className="flex-shrink-0 mx-4">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 uppercase">
                    Mesa {table.name}
                </h2>
            </div>
            <div className="flex-1"></div>
        </header>

        <main className="flex-grow overflow-y-auto">
            <div className="p-4 sm:p-6 container mx-auto max-w-3xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="relative" ref={guestSelectorRef}>
                        <button 
                            type="button" 
                            onClick={() => setIsGuestSelectorOpen(prev => !prev)}
                            className="flex items-baseline gap-2 rounded-lg px-3 py-1 hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                            aria-haspopup="true"
                            aria-expanded={isGuestSelectorOpen}
                            aria-label={`Comensal activo ${activeGuest}, haga clic para cambiar`}
                        >
                            <span className="text-sm font-bold text-purple-300 uppercase">
                                Comensal Activo
                            </span>
                            <span className="text-2xl font-extrabold text-white leading-none">
                                {activeGuest}
                            </span>
                        </button>
                        {isGuestSelectorOpen && (
                            <div className="absolute z-20 top-full mt-2 bg-gray-600 border border-gray-500 rounded-md shadow-lg min-w-[150px]">
                                <ul className="py-1 max-h-48 overflow-y-auto">
                                    {allGuestNumbers.map(guestNum => (
                                        <li key={guestNum}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleSetActiveGuest(guestNum);
                                                    setIsGuestSelectorOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${activeGuest === guestNum ? 'bg-purple-600 text-white' : 'text-gray-200 hover:bg-purple-500'}`}
                                            >
                                                Comensal {guestNum}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <button 
                        type="button" 
                        onClick={handleAddNewGuest}
                        className="flex items-center gap-2 text-sm font-semibold bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                        <UserIcon /> + Comensal
                    </button>
                </div>

                <div className="relative mb-6">
                    <input
                        type="text"
                        value={filterQuery}
                        onChange={handleFilterChange}
                        placeholder="Buscar producto y añadir..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-md pl-10 pr-3 py-2 text-base focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <SearchIcon />
                    </div>
                </div>

                {filterQuery.trim() !== '' && (
                <div className="mb-6">
                    {filteredProducts.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="flex-1 text-left text-lg font-semibold text-purple-300 uppercase tracking-wider">Resultados de la búsqueda</h3>
                                <button
                                    onClick={() => {
                                        setFilteredProducts([]);
                                        setFilterQuery('');
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    aria-label="Cerrar búsqueda"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                                {filteredProducts.map((product) => {
                                    const nameParts = product.name.split(' - ');
                                    const title = nameParts[0];
                                    const description = nameParts.slice(1).join(' - ');
                                    return (
                                        <button 
                                            key={product.id}
                                            onClick={() => handleSelectProduct(product)} 
                                            className="w-full text-left p-3 bg-gray-900/50 rounded-md hover:bg-purple-800/40 border border-gray-700 hover:border-purple-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <p className="font-bold text-white">{title}</p>
                                            {description && (
                                                <p className="text-sm text-gray-300 mt-1">{description}</p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-4 bg-gray-900/50 border border-gray-700 rounded-md">
                            <p className="text-gray-400">No se encontraron productos para "{filterQuery}"</p>
                        </div>
                    )}
                </div>
                )}
                
                {isSummaryView ? (
                    <div>
                        <h3 className="text-xl font-bold text-center mb-4 text-purple-300 uppercase tracking-wider">Resumen del Pedido</h3>
                        <div className="space-y-2 bg-gray-800 rounded-lg p-4">
                            {orderSummary.length > 0 ? (
                                orderSummary.map(item => (
                                    <div key={item.name} className="flex justify-start items-center text-lg p-2 border-b border-gray-700/50 last:border-b-0">
                                        <span className="font-bold text-purple-300 w-12 text-right mr-4">{item.quantity} x</span>
                                        <span className="font-medium text-white">{getDisplayName(item.name)}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">Aún no hay artículos en este pedido.</p>
                            )}
                        </div>
                    </div>
                ) : (
                <div className="space-y-4">
                    {table.order.length > 0 ? (
                        (Object.entries(groupedOrder) as [string, OrderItem[]][])
                        .sort(([guestA], [guestB]) => Number(guestA) - Number(guestB))
                        .map(([guest, items]) => {
                        const guestSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                        return (
                            <div key={guest} className="bg-gray-800 rounded-lg p-3">
                                <div 
                                    onClick={() => handleSetActiveGuest(Number(guest))}
                                    className={`relative flex justify-center items-center border-b border-gray-700 pb-2 mb-2 cursor-pointer rounded-t-md -m-3 p-3 mb-2 transition-colors ${activeGuest === Number(guest) ? 'bg-purple-500/20' : 'hover:bg-gray-700/50'}`}
                                    role="button"
                                    aria-label={`Activar Comensal ${guest}`}
                                >
                                    <h3 className="font-bold text-lg text-purple-300">Comensal {guest}</h3>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-semibold text-gray-300">{guestSubtotal.toFixed(2)} €</span>
                                </div>
                                <div className="space-y-2">
                                    {[...items].sort((a, b) => {
                                        const parse = (id: string) => id.split('.').map(s => parseInt(s, 10));
                                        const partsA = parse(a.id);
                                        const partsB = parse(b.id);
                                        
                                        // Compare main part (the timestamp)
                                        if (partsB[0] !== partsA[0]) {
                                            return partsB[0] - partsA[0];
                                        }
                                        
                                        // If main part is same, it's a commanded item and its pending additions.
                                        // A higher sub-part means it's newer (e.g., .1, .2). It should come first.
                                        const subA = partsA[1] || 0; // Commanded item has no sub-part, defaults to 0
                                        const subB = partsB[1] || 0;
                                        
                                        return subB - subA;
                                    }).map(item => (
                                    <div
                                      key={item.id}
                                      onDoubleClick={() => setNoteModalItem(item)}
                                      className={`p-3 rounded-lg cursor-pointer ${item.status === 'pending' ? 'bg-yellow-900/50' : 'bg-green-800/40'}`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-grow mr-2">
                                          <p className="font-semibold text-white mb-1">{item.quantity} x {getDisplayName(item.name)}</p>
                                          <div className="text-sm text-gray-400">
                                            <span>{item.price.toFixed(2)} €</span>
                                            <span className="font-bold text-gray-200 ml-4">Total: {(item.quantity * item.price).toFixed(2)} €</span>
                                          </div>
                                          {item.note && (
                                            <p className="text-sm text-purple-300 italic pt-2 pl-1 border-l-2 border-purple-400/50 ml-1 mt-2">{item.note}</p>
                                          )}
                                        </div>

                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${item.status === 'pending' ? 'bg-yellow-400 text-yellow-900' : 'bg-green-400 text-green-900'}`}>
                                                {item.status === 'pending' ? 'Pendiente' : 'Comandado'}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDecrementItem(item.id); }}
                                                    className="text-gray-400 hover:text-purple-400 transition-colors p-1 rounded-full hover:bg-gray-600"
                                                    aria-label={`Quitar uno de ${item.name}`}
                                                >
                                                    <MinusIcon />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onAddItem({ name: item.name, quantity: 1, price: item.price, note: item.note, guest: item.guest }, item.id); }}
                                                    className="text-gray-400 hover:text-purple-400 transition-colors p-1 rounded-full hover:bg-gray-600"
                                                    aria-label={`Añadir uno más de ${item.name}`}
                                                >
                                                    <PlusIcon />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); onRequestDeleteItem(item.id, item.name); }} className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-600">
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </div>
                                      </div>
                                    </div>
                                    ))}
                                </div>
                            </div>
                        );
                        })
                    ) : (
                    <p className="text-center text-gray-500 py-8">Aún no hay artículos en este pedido.</p>
                    )}
                </div>
                )}
            </div>
        </main>

        <footer className="p-4 border-t border-gray-700 space-y-3 bg-gray-800/50 backdrop-blur-sm sticky bottom-0">
          <div className="container mx-auto max-w-3xl">
              <div className="flex justify-between items-center text-right mb-3 gap-4">
                <button
                  onClick={onClose}
                  disabled={!hasPendingItems}
                  className="flex-grow px-6 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-bold text-yellow-900 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                  aria-label="Guardar y Salir"
                >
                  <DisketteIcon />
                  <span className="uppercase tracking-wider">Guardar</span>
                </button>
                <div className="flex-shrink-0">
                  <span className="text-lg text-gray-400 mr-2">Total:</span>
                  <span className="text-2xl font-bold text-white">{totalAmount.toFixed(2)} €</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                  <button
                    onClick={() => setIsSummaryView(prev => !prev)}
                    disabled={table.order.length === 0}
                    className="flex flex-col items-center justify-center gap-1 p-2 font-bold rounded-lg transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed aspect-square bg-indigo-500 hover:bg-indigo-600 text-white"
                    aria-label={isSummaryView ? 'Ver Detalle' : 'Ver Resumen'}
                  >
                    <ListBulletIcon />
                    <span className="text-xs tracking-wider uppercase">{isSummaryView ? 'Detalle' : 'Resumen'}</span>
                  </button>
                  <button
                    onClick={onCommandAndClose}
                    disabled={!hasPendingItems}
                    className="flex flex-col items-center justify-center gap-1 p-2 font-bold rounded-lg transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed aspect-square bg-green-500 hover:bg-green-600 text-white"
                    aria-label="Comandar Todo"
                  >
                    <BellIcon />
                    <span className="text-xs tracking-wider uppercase">Comandar</span>
                  </button>
                  <button
                    onClick={onPrintBill}
                    disabled={hasPendingItems || table.order.length === 0}
                    className="flex flex-col items-center justify-center gap-1 p-2 font-bold rounded-lg transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed aspect-square bg-blue-500 hover:bg-blue-600 text-white"
                    aria-label="Imprimir Cuenta"
                  >
                    <PrinterIcon />
                    <span className="text-xs tracking-wider uppercase">Imprimir</span>
                  </button>
                  <button
                    onClick={onCloseTable}
                    disabled={table.status !== TableStatus.Billed && table.order.length > 0}
                    className="flex flex-col items-center justify-center gap-1 p-2 font-bold rounded-lg transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed aspect-square bg-red-600 hover:bg-red-700 text-white"
                    aria-label="Cerrar Mesa"
                  >
                    <XCircleIcon />
                    <span className="text-xs tracking-wider uppercase">Cerrar</span>
                  </button>
              </div>
          </div>
        </footer>
    </div>
  );
};

export default OrderPage;
