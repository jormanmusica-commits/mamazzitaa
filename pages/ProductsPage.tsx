import React, { useState } from 'react';
import { Product, Category } from '../types';
import { PencilIcon, CheckIcon, CloseIcon } from '../components/icons';

interface ProductsPageProps {
  categories: Category[];
  products: Product[];
  onUpdateProduct: (updatedProduct: Product) => void;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ categories, products, onUpdateProduct }) => {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  const handleEditClick = (product: Product) => {
    setEditingProductId(product.id);
    setEditingPrice(product.price?.toString() ?? '');
  };

  const handleSavePrice = (product: Product) => {
    onUpdateProduct({ ...product, price: parseFloat(editingPrice || '0') });
    setEditingProductId(null);
    setEditingPrice('');
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditingPrice('');
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl sm:text-4xl text-center font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-8">
        Gestión de Productos
      </h1>
      <div className="space-y-8">
        {categories.map(category => (
          <div key={category.id} className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-purple-400 border-b-2 border-gray-700 pb-2 mb-4">{category.name}</h2>
            
            <ul className="space-y-2">
              {products.filter(p => p.category === category.id).map(product => (
                <li key={product.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                  <span className="text-gray-200">{product.name}</span>
                  {editingProductId === product.id ? (
                     <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                            className="w-20 bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-base focus:ring-2 focus:ring-purple-500 focus:outline-none text-right"
                            autoFocus
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') handleSavePrice(product);
                                if(e.key === 'Escape') handleCancelEdit();
                            }}
                        />
                        <span className="text-gray-400">€</span>
                        <button onClick={() => handleSavePrice(product)} className="text-green-400 hover:text-green-300 p-1 rounded-full hover:bg-gray-600">
                            <CheckIcon />
                        </button>
                        <button onClick={handleCancelEdit} className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-600">
                            <CloseIcon />
                        </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-300">{(product.price ?? 0).toFixed(2)} €</span>
                        <button onClick={() => handleEditClick(product)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-600">
                            <PencilIcon />
                        </button>
                    </div>
                  )}
                </li>
              ))}
               {products.filter(p => p.category === category.id).length === 0 && (
                <p className="text-gray-500">No hay productos en esta categoría.</p>
               )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsPage;