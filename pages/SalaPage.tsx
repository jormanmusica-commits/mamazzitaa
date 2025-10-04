import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Table, TableStatus, OrderItem, Product } from '../types';
import TableLayout from '../components/TableLayout';
import OrderPage from './OrderPage';
import ConfirmationModal from '../components/ConfirmationModal';
import { CogIcon } from '../components/icons';

const initialLayouts: Record<string, Table[]> = {
  principal: [
    // Row 1 (Reversed)
    { id: 15, name: '15', x: 5, y: 10, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 14, name: '14', x: 24, y: 10, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 12, name: '12', x: 43, y: 10, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 11, name: '11', x: 62, y: 10, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 10, name: '10', x: 81, y: 10, status: TableStatus.Available, order: [], shape: 'square' },
    // Row 2 (20s row, reversed)
    { id: 24, name: '24', x: 5, y: 35, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 23, name: '23', x: 24, y: 35, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 22, name: '22', x: 43, y: 35, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 21, name: '21', x: 62, y: 35, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 20, name: '20', x: 81, y: 35, status: TableStatus.Available, order: [], shape: 'square' },
    // Row 3 (30s row + Bar tables)
    { id: 5, name: 'B5', x: 5, y: 60, status: TableStatus.Available, order: [], shape: 'round' },
    { id: 4, name: 'B4', x: 16, y: 60, status: TableStatus.Available, order: [], shape: 'round' },
    { id: 3, name: 'B3', x: 27, y: 60, status: TableStatus.Available, order: [], shape: 'round' },
    { id: 2, name: 'B2', x: 38, y: 60, status: TableStatus.Available, order: [], shape: 'round' },
    { id: 1, name: 'B1', x: 49, y: 60, status: TableStatus.Available, order: [], shape: 'round' },
    { id: 31, name: '31', x: 62, y: 60, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 30, name: '30', x: 81, y: 60, status: TableStatus.Available, order: [], shape: 'square' },
  ],
  terraza: [
    // Row 1 (50s row, reversed, re-spaced)
    { id: 54, name: '54', x: 2, y: 15, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 53, name: '53', x: 18, y: 15, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 52, name: '52', x: 34, y: 15, status: TableStatus.Available, order: [], shape: 'double' },
    { id: 51, name: '51', x: 62, y: 15, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 50, name: '50', x: 78, y: 15, status: TableStatus.Available, order: [], shape: 'square' },
     // Row 2 (40s row, reversed)
    { id: 43, name: '43', x: 10, y: 50, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 42, name: '42', x: 30, y: 50, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 41, name: '41', x: 50, y: 50, status: TableStatus.Available, order: [], shape: 'square' },
    { id: 40, name: '40', x: 70, y: 50, status: TableStatus.Available, order: [], shape: 'square' },
  ],
};

const LAYOUTS_STORAGE_KEY = 'mamazzitaa-layouts';

interface SalaPageProps {
  products: Product[];
  onNavigate: (page: 'sala' | 'productos') => void;
}

const SalaPage: React.FC<SalaPageProps> = ({ products, onNavigate }) => {
  const [layouts, setLayouts] = useState<Record<string, Table[]>>(() => {
    try {
      const savedLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
      if (savedLayouts) {
        const parsedLayouts = JSON.parse(savedLayouts);
        // Basic validation
        if (typeof parsedLayouts === 'object' && parsedLayouts !== null && !Array.isArray(parsedLayouts)) {
          return parsedLayouts;
        }
      }
    } catch (error) {
      console.error("Error loading layouts from localStorage", error);
    }
    return initialLayouts;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(layouts));
    } catch (error) {
      console.error("Error saving layouts to localStorage", error);
    }
  }, [layouts]);

  const roomOrder = useMemo(() => ['principal', 'terraza'], []);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const currentRoomId = roomOrder[currentRoomIndex];

  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingState, setDraggingState] = useState<{ tableId: number; offsetX: number; offsetY: number; } | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);
  const [isChangingTableMode, setIsChangingTableMode] = useState(false);
  const [sourceTableForChange, setSourceTableForChange] = useState<{ tableId: number; roomId: string; } | null>(null);

  // Swipe gesture state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const MIN_SWIPE_DISTANCE = 50;

  // Ref to ensure unique, monotonically increasing IDs for items
  const lastIdTimestamp = useRef(0);

  // State for time-based alerts
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // Check every 30 seconds
    return () => clearInterval(timer);
  }, []);

  const ALERT_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

  const alertingTables = useMemo(() => {
    const tableIds = new Set<number>();
    const now = currentTime;
    
    // Fix: Explicitly type the 'table' parameter to resolve type inference issues where properties on 'table' were not being recognized.
    Object.values(layouts).flat().forEach((table: Table) => {
        if (table.status === TableStatus.Pending) {
            const hasOldPendingItem = table.order.some(item => 
                item.status === 'pending' && (now - item.timestamp) > ALERT_THRESHOLD
            );
            if (hasOldPendingItem) {
                tableIds.add(table.id);
            }
        }
    });
    return tableIds;
  }, [layouts, currentTime]);


  const generateUniqueItemId = useCallback(() => {
    let newTimestamp = Date.now();
    if (newTimestamp <= lastIdTimestamp.current) {
        newTimestamp = lastIdTimestamp.current + 1;
    }
    lastIdTimestamp.current = newTimestamp;
    return newTimestamp.toString();
  }, []);


  const onTouchStart = (e: React.TouchEvent) => {
    if (confirmation || selectedTableId || isEditMode || draggingState) return;
    touchEndX.current = 0;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (confirmation || selectedTableId || isEditMode || draggingState) return;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (confirmation || selectedTableId || isEditMode || draggingState) return;
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe) {
        setCurrentRoomIndex(prev => (prev + 1) % roomOrder.length);
    } else if (isRightSwipe) {
        setCurrentRoomIndex(prev => (prev - 1 + roomOrder.length) % roomOrder.length);
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
  };
  
  const tables = layouts[currentRoomId] || [];

  const handleCloseModal = () => {
    setSelectedTableId(null);
  };
  
  const updateTable = (roomId: string, tableId: number, updates: Partial<Table>) => {
    setLayouts(prevLayouts => ({
        ...prevLayouts,
        [roomId]: prevLayouts[roomId].map(t =>
            t.id === tableId ? { ...t, ...updates } : t
        )
    }));
  };

  const handleAddItem = (newItemData: Omit<OrderItem, 'id' | 'status' | 'timestamp'>, sourceItemId?: string) => {
    if (!selectedTableId) return;
    const currentTable = tables.find(t => t.id === selectedTableId);
    if (!currentTable) return;

    let order = [...currentTable.order];

    const itemToAdd = sourceItemId
      ? (() => {
          const sourceItem = order.find(item => item.id === sourceItemId);
          return sourceItem
            ? {
                name: sourceItem.name,
                quantity: 1,
                price: sourceItem.price,
                note: sourceItem.note,
                guest: sourceItem.guest,
              }
            : null;
        })()
      : newItemData;

    if (!itemToAdd) return;

    const existingPendingItemIndex = order.findIndex(
      (item) =>
        item.status === 'pending' &&
        item.name === itemToAdd.name &&
        item.price === itemToAdd.price &&
        (item.note || '') === (itemToAdd.note || '') &&
        item.guest === itemToAdd.guest
    );

    if (existingPendingItemIndex !== -1) {
      const updatedItem = { ...order[existingPendingItemIndex] };
      updatedItem.quantity += itemToAdd.quantity;
      updatedItem.timestamp = Date.now(); // Reset timer on interaction
      order[existingPendingItemIndex] = updatedItem;
    } else {
      const commandedMatches = order
        .filter(
          (item) =>
            item.status === 'commanded' &&
            item.name === itemToAdd.name &&
            item.price === itemToAdd.price &&
            (item.note || '') === (itemToAdd.note || '') &&
            item.guest === itemToAdd.guest
        )
        .sort((a, b) => Number(b.id.split('.')[0]) - Number(a.id.split('.')[0]));

      let newId;
      if (commandedMatches.length > 0) {
        const latestParent = commandedMatches[0];
        const baseId = latestParent.id.split('.')[0];
        const childItems = order.filter((item) => item.id.startsWith(baseId + '.'));
        const maxFraction =
          childItems.length > 0
            ? Math.max(...childItems.map((i) => Number(i.id.split('.')[1] || '0')))
            : 0;
        newId = baseId + '.' + (maxFraction + 1);
      } else {
        newId = generateUniqueItemId();
      }

      const newItem: OrderItem = {
        ...itemToAdd,
        id: newId,
        status: 'pending',
        timestamp: Date.now(),
      };
      order.push(newItem);
    }
    updateTable(currentRoomId, selectedTableId, { order, status: TableStatus.Pending });
  };
  
  const handleDecrementItem = (itemId: string) => {
    if (!selectedTableId) return;
    const currentTable = tables.find(t => t.id === selectedTableId);
    if (!currentTable) return;

    const order = [...currentTable.order];
    const itemIndex = order.findIndex(item => item.id === itemId);

    if (itemIndex > -1) {
        const updatedOrder = [...order];
        const item = { ...updatedOrder[itemIndex] };

        if (item.quantity > 1) {
            item.quantity -= 1;
            updatedOrder[itemIndex] = item;
        } else {
            updatedOrder.splice(itemIndex, 1);
        }
        
        let newStatus = currentTable.status;
        if (updatedOrder.length === 0) {
            newStatus = TableStatus.Available;
        } else if (!updatedOrder.some(i => i.status === 'pending')) {
            if (currentTable.status === TableStatus.Pending) {
                newStatus = TableStatus.Ordered;
            }
        }


        updateTable(currentRoomId, selectedTableId, { order: updatedOrder, status: newStatus });
    }
  };

  const handleUpdateItemNote = (itemId: string, note: string) => {
    if (!selectedTableId) return;
    const currentTable = tables.find(t => t.id === selectedTableId);
    if (!currentTable) return;

    const updatedOrder = currentTable.order.map(item =>
      item.id === itemId ? { ...item, note } : item
    );

    updateTable(currentRoomId, selectedTableId, { order: updatedOrder });
  };

  const handleCommand = () => {
    if (!selectedTableId) return;
    const currentTable = layouts[currentRoomId].find(t => t.id === selectedTableId);
    if (!currentTable) return;

    const pendingItems = currentTable.order.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) return;

    let commandedItems = currentTable.order.filter(item => item.status === 'commanded');

    // Consolidate all pending items into groups with summed quantities
    const pendingGroups = new Map<string, OrderItem>();
    for (const item of pendingItems) {
        const key = `${item.name}|${item.price}|${item.guest}|${item.note || ''}`;
        if (pendingGroups.has(key)) {
            const existing = pendingGroups.get(key)!;
            existing.quantity += item.quantity;
            existing.id = item.id; // Use the latest ID for sorting new item groups
        } else {
            pendingGroups.set(key, { ...item }); // Clone to avoid mutation
        }
    }

    // Process each consolidated pending group against the commanded items
    pendingGroups.forEach(pendingGroup => {
        const matchingCommandedIndex = commandedItems.findIndex(
            cmdItem => 
                cmdItem.name === pendingGroup.name &&
                cmdItem.price === pendingGroup.price &&
                (cmdItem.note || '') === (pendingGroup.note || '') &&
                cmdItem.guest === pendingGroup.guest
        );

        if (matchingCommandedIndex !== -1) {
            // Match found: update the existing commanded item
            const updatedItem = {
                ...commandedItems[matchingCommandedIndex],
                quantity: commandedItems[matchingCommandedIndex].quantity + pendingGroup.quantity,
                // CRUCIAL: Assign a new, unique, sortable ID.
                id: generateUniqueItemId(),
            };
            commandedItems[matchingCommandedIndex] = updatedItem;
        } else {
            // No match found: this is a new item type being commanded
            commandedItems.push({
                ...pendingGroup,
                status: 'commanded',
            });
        }
    });

    updateTable(currentRoomId, selectedTableId, {
        order: commandedItems,
        status: TableStatus.Ordered,
    });
  };
  
  const handleCommandAndClose = () => {
    handleCommand();
    handleCloseModal();
  };

  const handlePrintBill = () => {
      if (!selectedTableId) return;
      const currentTable = tables.find(t => t.id === selectedTableId);
      if(currentTable && !currentTable.order.some(item => item.status === 'pending')){
          updateTable(currentRoomId, selectedTableId, { status: TableStatus.Billed });
      }
  };

  const handleCloseTable = () => {
      if (!selectedTableId) return;
      const currentTable = tables.find(t => t.id === selectedTableId);
      if(currentTable && (currentTable.status === TableStatus.Billed || currentTable.order.length === 0)) {
        updateTable(currentRoomId, selectedTableId, { order: [], status: TableStatus.Available });
        handleCloseModal();
      }
  };
  
  const requestDeleteItem = (itemId: string, itemName: string) => {
    setConfirmation({
      title: `Eliminar "${itemName}"`,
      message: '¿Estás seguro de que quieres eliminar este artículo del pedido? Esta acción no se puede deshacer.',
      onConfirm: () => {
        if (!selectedTableId) return;
        const currentTable = layouts[currentRoomId].find(t => t.id === selectedTableId);
        if (currentTable) {
            const updatedOrder = currentTable.order.filter(item => item.id !== itemId);
            const hasPending = updatedOrder.some(item => item.status === 'pending');
            let newStatus = currentTable.status;
            
            if (updatedOrder.length === 0) {
                newStatus = TableStatus.Available;
            } else if (!hasPending && (newStatus === TableStatus.Pending || newStatus === TableStatus.Billed)) {
                newStatus = TableStatus.Ordered;
            } else if (hasPending && newStatus === TableStatus.Billed) {
                 newStatus = TableStatus.Pending
            }

            updateTable(currentRoomId, selectedTableId, { order: updatedOrder, status: newStatus });
        }
        setConfirmation(null);
      },
    });
  };
  
  const cancelChangeTable = () => {
    setSourceTableForChange(null);
    setIsChangingTableMode(false);
  };

  const executeChangeTable = (targetTableId: number, targetRoomId: string) => {
    if (!sourceTableForChange) return;

    const { tableId: sourceTableId, roomId: sourceRoomId } = sourceTableForChange;

    setLayouts(prevLayouts => {
      const newLayouts = JSON.parse(JSON.stringify(prevLayouts));

      const sourceRoomTables = newLayouts[sourceRoomId];
      const sourceTable = sourceRoomTables.find((t: Table) => t.id === sourceTableId);

      const targetRoomTables = newLayouts[targetRoomId];
      const targetTable = targetRoomTables.find((t: Table) => t.id === targetTableId);

      if (sourceTable && targetTable && targetTable.status === TableStatus.Available) {
        // Transfer data
        targetTable.order = sourceTable.order;
        targetTable.status = sourceTable.status;
        
        // Reset source table
        sourceTable.order = [];
        sourceTable.status = TableStatus.Available;
      }
      
      return newLayouts;
    });

    cancelChangeTable();
  };


  const requestDeleteTable = (table: Table) => {
      setConfirmation({
        title: `Eliminar Mesa ${table.name}`,
        message: '¿Estás seguro? Esta acción no se puede deshacer.',
        onConfirm: () => {
           setLayouts(prevLayouts => ({
            ...prevLayouts,
            [currentRoomId]: prevLayouts[currentRoomId].filter(t => t.id !== table.id)
          }));
          setConfirmation(null);
        },
      });
  };
  
  const handleTableDragStart = (tableId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isEditMode || !layoutRef.current) return;
    const tableElement = e.currentTarget as HTMLElement;
    const tableRect = tableElement.getBoundingClientRect();
    setDraggingState({
        tableId,
        offsetX: e.clientX - tableRect.left,
        offsetY: e.clientY - tableRect.top,
    });
  };

  const handleLayoutMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingState || !layoutRef.current) return;
    
    e.preventDefault();
    const layoutRect = layoutRef.current.getBoundingClientRect();
    const tableElement = document.querySelector(`[data-table-id='${draggingState.tableId}']`) as HTMLElement;
    if (!tableElement) return;

    const tableWidth = tableElement.offsetWidth;
    const tableHeight = tableElement.offsetHeight;

    let x = ((e.clientX - layoutRect.left - draggingState.offsetX) / layoutRect.width) * 100;
    let y = ((e.clientY - layoutRect.top - draggingState.offsetY) / layoutRect.height) * 100;

    const maxX = (layoutRect.width - tableWidth) / layoutRect.width * 100;
    const maxY = (layoutRect.height - tableHeight) / layoutRect.height * 100;

    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

    setLayouts(prevLayouts => ({
        ...prevLayouts,
        [currentRoomId]: prevLayouts[currentRoomId].map(t =>
            t.id === draggingState.tableId ? { ...t, x, y } : t
        )
    }));
  }, [draggingState, currentRoomId]);

  const handleLayoutMouseUp = useCallback(() => {
    setDraggingState(null);
  }, []);
  
  const handleRestoreLayout = () => {
    setConfirmation({
      title: '¿Restaurar Disposición del Salón?',
      message: 'Las mesas volverán a su posición original. Los pedidos en las mesas activas se conservarán.',
      onConfirm: () => {
        setLayouts(currentLayouts => {
            const currentTables = currentLayouts[currentRoomId] || [];
            const initialTablesForRoom = initialLayouts[currentRoomId];

            const restoredTables = initialTablesForRoom.map(initialTable => {
                const currentTable = currentTables.find(t => t.id === initialTable.id);
                if (currentTable && currentTable.order.length > 0) {
                    return {
                        ...initialTable,
                        status: currentTable.status,
                        order: currentTable.order,
                    };
                }
                return initialTable;
            });

            return { ...currentLayouts, [currentRoomId]: restoredTables };
        });
        setConfirmation(null);
      },
    });
  };

  const handleTableClick = (table: Table) => {
    if (isEditMode && !isChangingTableMode) return;

    if (isChangingTableMode) {
      if (!sourceTableForChange) {
        // Step 1: Select an occupied source table
        if (table.status !== TableStatus.Available) {
          setSourceTableForChange({ tableId: table.id, roomId: currentRoomId });
        }
      } else {
        // Step 2: Select a destination table
        if (table.id === sourceTableForChange.tableId && currentRoomId === sourceTableForChange.roomId) {
          // Allow deselecting the source table
          setSourceTableForChange(null);
        } else if (table.status === TableStatus.Available) {
          executeChangeTable(table.id, currentRoomId);
        }
      }
    } else {
      setSelectedTableId(table.id);
    }
  };

  useEffect(() => {
    if (draggingState) {
        document.addEventListener('mousemove', handleLayoutMouseMove);
        document.addEventListener('mouseup', handleLayoutMouseUp);
    } else {
        document.removeEventListener('mousemove', handleLayoutMouseMove);
        document.removeEventListener('mouseup', handleLayoutMouseUp);
    }
    return () => {
        document.removeEventListener('mousemove', handleLayoutMouseMove);
        document.removeEventListener('mouseup', handleLayoutMouseUp);
    };
  }, [draggingState, handleLayoutMouseMove, handleLayoutMouseUp]);

  const detailedSelectedTable = useMemo(() => {
    if (!selectedTableId) return null;
    const currentTables = layouts[currentRoomId] || [];
    return currentTables.find(t => t.id === selectedTableId) || null;
  }, [selectedTableId, layouts, currentRoomId]);


  return (
    <>
      {confirmation && (
        <ConfirmationModal
          isOpen={true}
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onCancel={() => setConfirmation(null)}
        />
      )}

      {detailedSelectedTable ? (
        <OrderPage
          table={detailedSelectedTable}
          products={products}
          onClose={handleCloseModal}
          onAddItem={handleAddItem}
          onCommandAndClose={handleCommandAndClose}
          onPrintBill={handlePrintBill}
          onCloseTable={handleCloseTable}
          onRequestDeleteItem={requestDeleteItem}
          onDecrementItem={handleDecrementItem}
          onUpdateItemNote={handleUpdateItemNote}
        />
      ) : (
        <div className="flex flex-col h-screen bg-gray-900 text-white" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <header className="flex-shrink-0 p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700 shadow-md z-10">
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Sala Mamazzita
            </h1>
            <button 
              onClick={() => onNavigate('productos')} 
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md shadow-lg transition-transform transform hover:scale-105"
            >
              <CogIcon />
              <span className="hidden sm:inline">Productos</span>
            </button>
          </header>

          <div className="flex-grow overflow-hidden flex flex-col">
            <div className="text-center py-2 flex-shrink-0">
              <div>
                  <h2 className="text-2xl font-semibold uppercase tracking-widest text-gray-300">{currentRoomId}</h2>
                  <div className="flex justify-center gap-2 mt-2">
                      {roomOrder.map((room, index) => (
                          <div key={room} onClick={() => setCurrentRoomIndex(index)} className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${index === currentRoomIndex ? 'bg-purple-400 scale-125' : 'bg-gray-600'}`}></div>
                      ))}
                  </div>
              </div>
            </div>
          
            <div className="flex-grow container mx-auto w-full relative" ref={layoutRef}>
              <div className="absolute inset-0">
                <div
                  className="flex transition-transform duration-500 ease-in-out h-full"
                  style={{ transform: `translateX(-${currentRoomIndex * 100}%)` }}
                >
                  {roomOrder.map((roomId) => (
                    <div key={roomId} className="w-full flex-shrink-0 h-full">
                      <TableLayout
                        tables={layouts[roomId] || []}
                        isEditMode={isEditMode}
                        onTableDragStart={handleTableDragStart}
                        onDeleteTable={requestDeleteTable}
                        isChangingTableMode={isChangingTableMode}
                        sourceTableId={sourceTableForChange?.tableId ?? null}
                        onTableClick={handleTableClick}
                        alertingTables={alertingTables}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <footer className="flex-shrink-0 z-30 bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-700">
            <div className="container mx-auto flex flex-col items-center gap-3">
              {isChangingTableMode && (
                <p className="text-lg font-semibold text-yellow-400 animate-pulse">
                  {sourceTableForChange
                    ? 'Seleccione la mesa LIBRE de destino'
                    : 'Seleccione la mesa de ORIGEN que desea cambiar'}
                </p>
              )}
              <div className="flex justify-center items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm sm:text-base ${isEditMode ? 'text-purple-400' : 'text-gray-500'}`}>Modo Edición</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isEditMode} onChange={() => { setIsEditMode(!isEditMode); cancelChangeTable(); }} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-purple-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                {isEditMode && (
                    <>
                      <button 
                          onClick={() => { setIsChangingTableMode(current => !current); setSourceTableForChange(null); }}
                          className={`font-bold py-1.5 px-3 text-sm sm:py-2 sm:px-4 sm:text-base rounded-md shadow-lg transition-all transform hover:scale-105 ${isChangingTableMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900'}`}
                      >
                          {isChangingTableMode ? 'Cancelar Cambio' : 'Cambiar Mesa'}
                      </button>
                      <button onClick={handleRestoreLayout} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 text-sm sm:py-2 sm:px-4 sm:text-base rounded-md shadow-lg transition-transform transform hover:scale-105">
                          Restaurar
                      </button>
                    </>
                  )}
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}

export default SalaPage;
