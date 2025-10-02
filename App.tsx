import React, { useState, useEffect } from 'react';
import { Product, Category } from './types';
import Header from './components/Header';
import SalaPage from './pages/SalaPage';
import ProductsPage from './pages/ProductsPage';

const initialCategories: Category[] = [
  { id: 'bebidas', name: 'Bebidas' },
  { id: 'cocteles', name: 'Cocteles' },
  { id: 'cocteles_autor', name: 'Cocteles de Autor' },
];

const initialProducts: Product[] = [
  // Bebidas
  { id: 'p1', name: 'Coca-Cola', category: 'bebidas', price: 50 },
  { id: 'p2', name: 'Agua sin gas', category: 'bebidas', price: 40 },
  { id: 'p3', name: 'Agua con gas', category: 'bebidas', price: 45 },
  { id: 'p4', name: 'Cerveza Corona', category: 'bebidas', price: 60 },
  // Cocteles
  { id: 'p5', name: 'Margarita', category: 'cocteles', price: 120 },
  { id: 'p6', name: 'Mojito', category: 'cocteles', price: 110 },
  { id: 'p7', name: 'Daiquiri', category: 'cocteles', price: 115 },
  // Cocteles de Autor
  { id: 'p8', name: 'Mamazzita Sour', category: 'cocteles_autor', price: 180 },
  { id: 'p9', name: 'Pasión Tropical', category: 'cocteles_autor', price: 190 },
];


function App() {
  const [page, setPage] = useState<'sala' | 'productos'>('sala');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);

  useEffect(() => {
    if (page === 'sala') {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup to restore default behavior when the component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [page]);


  const handleAddProduct = (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
        ...newProductData,
        id: `p${Date.now()}`,
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
        <Header currentPage={page} onNavigate={setPage} />
        <main className="p-2 sm:p-4 md:p-6">
            {page === 'sala' && <SalaPage products={products} />}
            {page === 'productos' && (
                <ProductsPage 
                    categories={categories}
                    products={products}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                />
            )}
        </main>
         <footer className="text-center pb-4 text-gray-500 text-sm">
            <p>Desarrollado con React & Tailwind CSS</p>
        </footer>
    </div>
  );
}

export default App;