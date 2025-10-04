import React from 'react';
import { Table } from '../types';
import { CloseIcon } from './icons';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
}

const BillModal: React.FC<BillModalProps> = ({ isOpen, onClose, table }) => {
  if (!isOpen) return null;

  const subtotal = table.order.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const tip = subtotal * 0.10;
  const total = subtotal + tip;

  const getDisplayName = (name: string) => {
    return name.split(' - ')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 border border-gray-200 text-gray-800">
        <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
            <h3 className="text-2xl font-bold text-gray-900">Cuenta Mesa {table.name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
                <CloseIcon />
            </button>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 mb-4">
            {table.order.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="flex-1 truncate pr-2">{item.quantity}x {getDisplayName(item.name)}</span>
                    <span className="font-mono">{(item.quantity * item.price).toFixed(2)}€</span>
                </div>
            ))}
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between items-center text-md">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-mono font-semibold">{subtotal.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between items-center text-md">
                <span className="text-gray-600">Propina voluntaria</span>
                <span className="font-mono font-semibold">{tip.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold mt-2 border-t border-gray-200 pt-2">
                <span className="text-gray-900">TOTAL</span>
                <span className="font-mono text-purple-600">{total.toFixed(2)}€</span>
            </div>
        </div>

        <div className="mt-6 flex justify-end">
            <button 
                onClick={onClose} 
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold text-white transition-colors"
            >
                Cerrar
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BillModal;