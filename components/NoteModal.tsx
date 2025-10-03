import React, { useState, useEffect, useRef } from 'react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  initialNote: string;
  itemName: string;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, onSave, initialNote, itemName }) => {
  const [note, setNote] = useState(initialNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNote(initialNote);
      // Focus and select the text in the textarea when the modal opens
      setTimeout(() => textareaRef.current?.select(), 100);
    }
  }, [isOpen, initialNote]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(note);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-1">Añadir Nota</h3>
        <p className="text-gray-300 mb-4 truncate">Para: <span className="font-semibold">{itemName}</span></p>
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-base focus:ring-2 focus:ring-purple-500 focus:outline-none mb-6 min-h-[80px]"
          placeholder="Ej: sin hielo, poco hecho..."
        />
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold text-white transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default NoteModal;
