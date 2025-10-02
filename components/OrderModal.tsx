import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Table, OrderItem, TableStatus, Product } from '../types';
import { CloseIcon, TrashIcon, PlusIcon, UserIcon, MinusIcon } from './icons';

interface OrderModalProps {
  table: Table;
  products: Product[];
  onClose: () => void;
  onAddItem: (newItemData: Omit<OrderItem, 'id' | 'status'>, sourceItemId?: string) => void;
  onCommand: () => void;
  onPrintBill: () => void;
  onCloseTable: () => void;
  onRequestDeleteItem: (itemId: string, itemName: string) => void;
  onDecrementItem: (itemId: string) => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ table, products, onClose, onAddItem, onCommand, onPrintBill, onCloseTable, onRequestDeleteItem, onDecrementItem }) => {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [activeGuest, setActiveGuest] = useState(1);
  const [isGuestSelectorOpen, setIsGuestSelectorOpen] = useState(false);
  const [isSummaryView, setIsSummaryView] = useState(false);
  const itemNameInputRef = useRef<HTMLInputElement>(null);
  const guestSelectorRef = useRef<HTMLDivElement>(null);

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

  const resetForm = () => {
    setItemName('');
    setQuantity('1');
    setPrice('');
    setNote('');
    setShowNoteInput(false);
    setSearchResults([]);
  };
  
  const handleSetActiveGuest = (guestNumber: number) => {
    setActiveGuest(guestNumber);
    setIsSummaryView(false); // Switch back to detail view when a guest is selected
    itemNameInputRef.current?.focus();
  };
  
  const handleAddNewGuest = () => {
    const newGuestNumber = maxGuestNumber + 1;
    setActiveGuest(newGuestNumber);
    setIsSummaryView(false);
  };


  const handleItemNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setItemName(query);

    if (query.trim() === '') {
        setSearchResults([]);
        return;
    }

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleSelectProduct = (product: Product) => {
      setItemName(product.name);
      setPrice(product.price?.toString() ?? '');
      setSearchResults([]);
  };

  const handleAddItemClick = (e: React.FormEvent) => {
    e.preventDefault();
    const numQuantity = parseInt(quantity, 10);
    const numPrice = parseFloat(price) || 0;
    const finalItemName = itemName.trim();

    if (finalItemName && numQuantity > 0) {
      onAddItem(
        { name: finalItemName, quantity: numQuantity, price: numPrice, note: note.trim(), guest: activeGuest }
      );
      
      resetForm();
    }
  };
  
  const hasPendingItems = useMemo(() => table.order.some(item => item.status === 'pending'), [table.order]);
  const totalAmount = useMemo(() => table.order.reduce((sum, item) => sum + (item.quantity * item.price), 0), [table.order]);
  
  const highestGuest = Math.max(maxGuestNumber, activeGuest);
  const allGuestNumbers = Array.from({ length: highestGuest }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 animate-modal-enter"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <header className="relative flex items-center justify-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 uppercase">
            Mesa {table.name}
          </h2>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </header>

        <div className="p-6 flex-grow overflow-y-auto">
          <form onSubmit={handleAddItemClick} className="space-y-4 mb-6">
            <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-3">
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
                <div className="relative">
                    <input
                    id="itemNameInput"
                    ref={itemNameInputRef}
                    type="text"
                    value={itemName}
                    onChange={handleItemNameChange}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setTimeout(() => setIsInputFocused(false), 150)}
                    placeholder="Buscar Artículo..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                    />
                    {isInputFocused && searchResults.length > 0 && (
                        <ul className="absolute z-10 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                            {searchResults.map(product => (
                                <li 
                                    key={product.id}
                                    className="px-3 py-2 cursor-pointer hover:bg-purple-600"
                                    onMouseDown={() => handleSelectProduct(product)}
                                >
                                    {product.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <input
                      id="quantityInput"
                      type="text"
                      pattern="\d*"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                      min="1"
                      placeholder="Cant."
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center"
                      required
                    />
                  </div>
                  <div>
                     <div className="relative">
                          <input
                              id="priceInput"
                              type="text"
                              pattern="[0-9.]*"
                              value={price}
                              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center pr-8"
                              placeholder="0.00"
                          />
                          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 pointer-events-none">
                              €
                          </span>
                      </div>
                  </div>
                </div>
                <div className="mt-4">
                  {showNoteInput ? (
                    <div>
                      <textarea
                        id="noteInput"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Ej: sin azúcar, poco hielo..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        rows={2}
                      ></textarea>
                    </div>
                  ) : (
                    <div className="text-right">
                      <button type="button" onClick={() => setShowNoteInput(true)} className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                        + Añadir Nota
                      </button>
                    </div>
                  )}
                </div>
                 <button type="submit" className="mt-4 w-full bg-purple-600 hover:bg-purple-700 rounded-md py-2 font-semibold transition-colors">
                  Añadir Artículo
                </button>
            </div>
          </form>

            {isSummaryView ? (
                 <div>
                    <h3 className="text-xl font-bold text-center mb-4 text-purple-300 uppercase tracking-wider">Resumen del Pedido</h3>
                    <div className="space-y-2 bg-gray-900/40 rounded-lg p-4">
                        {orderSummary.length > 0 ? (
                            orderSummary.map(item => (
                                <div key={item.name} className="flex justify-start items-center text-lg p-2 border-b border-gray-700/50 last:border-b-0">
                                    <span className="font-bold text-purple-300 w-12 text-right mr-4">{item.quantity} x</span>
                                    <span className="font-medium text-white">{item.name}</span>
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
                        <div key={guest} className="bg-gray-900/40 rounded-lg p-3">
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
                                  <div key={item.id} className={`relative flex items-center p-3 rounded-lg ${item.status === 'pending' ? 'bg-yellow-900/50' : 'bg-green-800/40'}`}>
                                      <span className={`absolute top-1.5 right-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${item.status === 'pending' ? 'bg-yellow-400 text-yellow-900' : 'bg-green-400 text-green-900'}`}>
                                            {item.status === 'pending' ? 'Pendiente' : 'Comandado'}
                                        </span>
                                      <div className="flex-grow">
                                          <p className="font-semibold text-white">{item.quantity} x {item.name}</p>
                                          <div className="text-sm text-gray-400 mt-1">
                                              <span>{item.price.toFixed(2)} €</span>
                                              <span className="font-bold text-gray-200 ml-4">Total: {(item.quantity * item.price).toFixed(2)} €</span>
                                          </div>
                                          {item.note && (
                                              <p className="text-xs text-purple-300 italic pt-1">{item.note}</p>
                                          )}
                                      </div>
                                      <div className="flex items-center pt-4">
                                        <button
                                          onClick={() => onDecrementItem(item.id)}
                                          className="text-gray-400 hover:text-purple-400 transition-colors p-1 rounded-full hover:bg-gray-600"
                                          aria-label={`Quitar uno de ${item.name}`}
                                        >
                                          <MinusIcon />
                                        </button>
                                        <button 
                                            onClick={() => onAddItem({ name: item.name, quantity: 1, price: item.price, note: item.note, guest: item.guest }, item.id)}
                                            className="ml-1 text-gray-400 hover:text-purple-400 transition-colors p-1 rounded-full hover:bg-gray-600"
                                            aria-label={`Añadir uno más de ${item.name}`}
                                        >
                                            <PlusIcon />
                                        </button>
                                        <button onClick={() => onRequestDeleteItem(item.id, item.name)} className="ml-1 text-gray-500 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-600">
                                            <TrashIcon />
                                        </button>
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

        <footer className="p-4 border-t border-gray-700 space-y-3">
          <div className="flex justify-between items-center text-right mb-3">
             <button
              onClick={() => setIsSummaryView(prev => !prev)}
              disabled={table.order.length === 0}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSummaryView ? 'Ver Detalle' : 'Resumen'}
            </button>
            <div>
              <span className="text-lg text-gray-400 mr-2">Total:</span>
              <span className="text-2xl font-bold text-white">{totalAmount.toFixed(2)} €</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={onCommand}
              disabled={!hasPendingItems}
              className="w-full px-4 py-3 font-bold rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed bg-yellow-500 hover:bg-yellow-600 text-yellow-900"
            >
              Comandar
            </button>
            <button
              onClick={onPrintBill}
              disabled={hasPendingItems || table.order.length === 0}
              className="w-full px-4 py-3 font-bold rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white"
            >
              Imprimir Cuenta
            </button>
            <button
              onClick={onCloseTable}
              disabled={table.status !== TableStatus.Billed && table.order.length > 0}
              className="w-full px-4 py-3 font-bold rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Cerrar Mesa
            </button>
          </div>
        </footer>
      </div>
       <style>{`
          @keyframes modal-enter {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-modal-enter {
            animation: modal-enter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
       `}</style>
    </div>
  );
};

export default OrderModal;
