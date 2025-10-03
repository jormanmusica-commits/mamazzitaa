import React from 'react';
import { Table as TableType } from '../types';
import Table from './Table';

interface TableLayoutProps {
  tables: TableType[];
  isEditMode: boolean;
  onTableDragStart: (tableId: number, e: React.MouseEvent<HTMLButtonElement>) => void;
  onDeleteTable: (table: TableType) => void;
  isChangingTableMode: boolean;
  sourceTableId: number | null;
  onTableClick: (table: TableType) => void;
}

const TableLayout: React.FC<TableLayoutProps> = ({ tables, isEditMode, onTableDragStart, onDeleteTable, isChangingTableMode, sourceTableId, onTableClick }) => {
  return (
    <div className="relative w-full h-full p-4 overflow-hidden">
      <div className="absolute inset-0 bg-grid-gray-700/[0.2]"></div>
      {isChangingTableMode && (
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-10 transition-opacity duration-300"></div>
      )}
      {tables.map(table => (
        <Table
          key={table.id}
          table={table}
          isEditMode={isEditMode}
          onDragStart={(e) => onTableDragStart(table.id, e)}
          onDelete={() => onDeleteTable(table)}
          isChangingTableMode={isChangingTableMode}
          sourceTableId={sourceTableId}
          onTableClick={() => onTableClick(table)}
        />
      ))}
    </div>
  );
};

export default TableLayout;