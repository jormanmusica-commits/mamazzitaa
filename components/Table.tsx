import React from 'react';
import { Table as TableType, TableStatus } from '../types';
import { TrashIcon } from './icons';

interface TableProps {
  table: TableType;
  isEditMode: boolean;
  onDragStart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete: () => void;
  isChangingTableMode: boolean;
  sourceTableId: number | null;
  onTableClick: () => void;
}

const getStatusClasses = (status: TableStatus, isChangingTableMode: boolean, isSource: boolean, sourceTableId: number | null, tableId: number) => {
  if (isChangingTableMode) {
    // Stage 2: Source table is selected, now we are selecting a destination
    if (sourceTableId) {
      if (isSource) {
        return 'bg-yellow-500 border-yellow-400 opacity-90 ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900';
      }
      if (status === TableStatus.Available) {
        return 'bg-blue-500 border-blue-400 cursor-pointer animate-pulse ring-4 ring-blue-400 ring-offset-2 ring-offset-gray-900';
      }
      return 'bg-gray-700 border-gray-600 opacity-40 cursor-not-allowed';
    } 
    // Stage 1: No source table selected yet, we are selecting an origin
    else {
      if (status !== TableStatus.Available) {
         return 'bg-purple-500 border-purple-400 cursor-pointer animate-pulse ring-4 ring-purple-400 ring-offset-2 ring-offset-gray-900';
      }
      return 'bg-gray-700 border-gray-600 opacity-40 cursor-not-allowed';
    }
  }

  switch (status) {
    case TableStatus.Available:
      return 'bg-gray-500 hover:bg-gray-600 text-gray-100 border-gray-400';
    case TableStatus.Pending:
      return 'bg-yellow-500 hover:bg-yellow-600 text-yellow-900 border-yellow-400 animate-pulse';
    case TableStatus.Ordered:
      return 'bg-green-500 hover:bg-green-600 text-white border-green-400';
    case TableStatus.Billed:
      return 'bg-red-500 hover:bg-red-600 text-white border-red-400';
    default:
      return 'bg-gray-300 border-gray-200';
  }
};

const Table: React.FC<TableProps> = ({ table, isEditMode, onDragStart, onDelete, isChangingTableMode, sourceTableId, onTableClick }) => {
  const tableShapeClasses = 
      table.shape === 'round' ? 'w-10 h-10 rounded-full'
    : table.shape === 'double' ? 'w-32 h-16 rounded-lg'
    : 'w-16 h-16 rounded-lg';

  let interactionClasses = '';
  if (isEditMode && !isChangingTableMode) {
    interactionClasses = 'cursor-move hover:scale-105';
  } else if (!isEditMode && !isChangingTableMode) {
    interactionClasses = 'cursor-pointer hover:scale-110';
  }

  const isSource = table.id === sourceTableId;
  const isClickDisabled = isChangingTableMode && (
    (!sourceTableId && table.status === TableStatus.Available) || 
    (sourceTableId && table.id !== sourceTableId && table.status !== TableStatus.Available)
  );

  return (
    <button
      data-table-id={table.id}
      onMouseDown={isEditMode ? onDragStart : undefined}
      onClick={!isEditMode || isChangingTableMode ? onTableClick : undefined}
      disabled={isClickDisabled}
      className={`absolute flex items-center justify-center font-bold text-lg shadow-lg transform transition-all duration-300 focus:outline-none focus:ring-opacity-50 z-20 border-2 ${tableShapeClasses} ${getStatusClasses(table.status, isChangingTableMode, isSource, sourceTableId, table.id)} ${interactionClasses}`}
      style={{ top: `${table.y}%`, left: `${table.x}%` }}
      aria-label={`Mesa ${table.name}`}
    >
      {table.name}
      {isEditMode && table.status === TableStatus.Available && (
        <div 
          className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 rounded-full p-1 text-white shadow-lg hover:bg-red-700 flex items-center justify-center cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Eliminar mesa ${table.name}`}
          >
          <TrashIcon />
        </div>
      )}
    </button>
  );
};

export default Table;