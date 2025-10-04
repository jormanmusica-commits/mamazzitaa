import React, { useState, useEffect } from 'react';
import { Product, Category } from './types';
import SalaPage from './pages/SalaPage';
import ProductsPage from './pages/ProductsPage';

const initialCategories: Category[] = [
  { id: 'tequila', name: 'Tequila' },
  { id: 'mezcal', name: 'Mezcal' },
  { id: 'sotol', name: 'Sotol' },
  { id: 'bacanora', name: 'Bacanora' },
  { id: 'charanda', name: 'Charanda' },
  { id: 'ginebra', name: 'Ginebra' },
  { id: 'vodka', name: 'Vodka' },
  { id: 'whisky', name: 'Whisky' },
  { id: 'ron', name: 'Ron' },
  { id: 'vinos', name: 'Vinos & Espumosos' },
  { id: 'otros', name: 'Licores & Otros' },
];

const initialProducts: Product[] = [
  // Tequila
  { id: 'p3', name: 'LLORONA - Tequila, Mezcal, Aperol, Mango, Limón.', category: 'tequila', price: 1 },
  { id: 'p8', name: 'SANTA MUERTE - Tequila Reposado, Mezcal, Jamaica, Fresa, Jalapeño.', category: 'tequila', price: 1 },
  { id: 'p33', name: 'Margarita - Tequila, Licor de Naranja (Triple Seco), Jugo de Lima.', category: 'tequila', price: 1 },
  { id: 'p38', name: 'Paloma - Tequila, Refresco de Toronja (Pomelo), Jugo de Lima, Sal.', category: 'tequila', price: 1 },

  // Mezcal
  { id: 'p4', name: 'LA NAHUALA - Mezcal, Maracuyá Picante, Licor de Naranja Agria, Miel de Sotol.', category: 'mezcal', price: 1 },
  { id: 'p6', name: 'LA INCONDICIONAL - Mezcal, Ancho Reyes Verde, Tamarindo, Piña.', category: 'mezcal', price: 1 },
  { id: 'p13', name: 'Mezcalita - Mezcal, Licor de Naranja (Triple Seco), Jugo de Limón, Jarabe (o Azúcar).', category: 'mezcal', price: 1 },
  { id: 'p47', name: 'Naked and Famous - Mezcal, Aperol, Chartreuse Amarillo, Jugo de Lima.', category: 'mezcal', price: 1 },

  // Sotol
  { id: 'p1', name: 'LA MALINCHE - Sotol, Aperol, Piña con Ceniza, Limón.', category: 'sotol', price: 1 },
  { id: 'p7', name: 'LA ADELITA - Sotol, Jerez Tío Pepe, Limón, Tejuino.', category: 'sotol', price: 1 },
  { id: 'p9', name: 'LA CATRINA - Crema de Sotol de Chocolate, Kalani de Coco, Café Espresso.', category: 'sotol', price: 1 },
  
  // Bacanora
  { id: 'p2', name: 'MARÍA BONITA - Bacanora, Licor de Cítricos y Hierbas, Sandía Roja, Miel de Sotol.', category: 'bacanora', price: 1 },
  
  // Charanda
  { id: 'p5', name: 'FRIDA - Charanda, Licor de Axiote, Jamaica, Habanero.', category: 'charanda', price: 1 },
  { id: 'p11', name: 'MARÍA SABINA - Charanda de Hongos, Naranja, Axiote, Chapulín.', category: 'charanda', price: 1 },

  // Ginebra
  { id: 'p10', name: 'IXCHEL - Ginebra infusionada con Frambuesa, Xtabentún, Toronja.', category: 'ginebra', price: 1 },
  { id: 'p21', name: 'Martinez - Ginebra, Vermut Rojo (Dulce), Marrasquino (Licor de cerezas), Amargos (Angostura u Old Tom).', category: 'ginebra', price: 1 },
  { id: 'p23', name: 'Martini Seco - Ginebra, Vermut Seco (Dry Vermouth), Aceituna o twist de limón.', category: 'ginebra', price: 1 },
  { id: 'p42', name: 'Clover Club - Ginebra, Jugo de Limón, Jarabe de Frambuesa, Clara de Huevo.', category: 'ginebra', price: 1 },
  { id: 'p43', name: 'Negroni - Ginebra, Campari, Vermut Rojo (Dulce).', category: 'ginebra', price: 1 },
  { id: 'p48', name: 'Bramble - Ginebra, Jugo de Limón, Jarabe de Azúcar, Crème de Mûre (Licor de Zarzamora).', category: 'ginebra', price: 1 },
  { id: 'p49', name: 'Last Word - Ginebra, Chartreuse Verde, Marrasquino, Jugo de Lima.', category: 'ginebra', price: 1 },

  // Vodka
  { id: 'p12', name: 'LA CHAVELA - Vodka infusionado con Flores, Licor de Maíz, Limón Fresco, Cardamomo.', category: 'vodka', price: 1 },
  { id: 'p15', name: 'Ruso Negro - Vodka, Licor de Café (Kahlúa).', category: 'vodka', price: 1 },
  { id: 'p16', name: 'Porn Star Martini - Vodka, Licor de Fruta de la Pasión, Jarabe de Vainilla, Jugo de Lima, servido con un chupito de vino espumoso.', category: 'vodka', price: 1 },
  { id: 'p17', name: 'Martini Expreso - Vodka, Licor de Café, Café Expreso, Jarabe de Azúcar.', category: 'vodka', price: 1 },
  { id: 'p29', name: 'Caipiroska - Vodka, Lima, Azúcar.', category: 'vodka', price: 1 },
  { id: 'p32', name: 'Bloody Mary - Vodka, Jugo de Tomate, Jugo de Limón, Salsa Inglesa (Worcestershire), Tabasco, Sal, Pimienta.', category: 'vodka', price: 1 },
  { id: 'p37', name: 'Lemon Drop Martini - Vodka, Licor de Naranja (Triple Seco), Jugo de Limón, Jarabe de Azúcar.', category: 'vodka', price: 1 },
  { id: 'p41', name: 'Cosmopolitan - Vodka Citron, Licor de Naranja (Triple Seco o Cointreau), Jugo de Arándano, Jugo de Lima.', category: 'vodka', price: 1 },

  // Whisky
  { id: 'p18', name: 'Old Fashion - Whisky (Bourbon o Rye), Azúcar (o Jarabe), Amargo de Angostura, un toque de soda (opcional).', category: 'whisky', price: 1 },
  { id: 'p19', name: 'Manhattan - Whisky (Rye o Bourbon), Vermut Rojo (Dulce), Amargo de Angostura.', category: 'whisky', price: 1 },
  { id: 'p20', name: 'Rob Roy - Whisky Scotch, Vermut Rojo (Dulce), Amargo de Angostura.', category: 'whisky', price: 1 },
  { id: 'p22', name: 'Pennicilin - Scotch Whisky, Whisky Scotch Ahumado (Islay), Jugo de Limón, Jarabe de Miel y Jengibre.', category: 'whisky', price: 1 },
  { id: 'p30', name: 'Mint Julep - Whisky Bourbon, Hojas de Menta, Azúcar (o Jarabe).', category: 'whisky', price: 1 },
  { id: 'p35', name: 'Amaretto Sour - Amaretto, Whisky Bourbon (o Rye, opcional), Jugo de Limón, Jarabe, Clara de Huevo (opcional).', category: 'whisky', price: 1 },
  { id: 'p36', name: 'Whisky Sour - Whisky (Bourbon o Rye), Jugo de Limón, Jarabe de Azúcar, Clara de Huevo (opcional).', category: 'whisky', price: 1 },
  { id: 'p44', name: 'Boulevardier - Whisky (Bourbon o Rye), Campari, Vermut Rojo (Dulce).', category: 'whisky', price: 1 },

  // Ron
  { id: 'p14', name: 'Piña Colada - Ron Blanco, Crema de Coco, Jugo de Piña.', category: 'ron', price: 1 },
  { id: 'p25', name: 'Daiquiri - Ron Blanco, Jugo de Lima, Jarabe de Azúcar.', category: 'ron', price: 1 },
  { id: 'p31', name: 'Mojito - Ron Blanco, Jugo de Lima, Hojas de Menta/Hierbabuena, Azúcar, Agua con gas.', category: 'ron', price: 1 },

  // Vinos & Espumosos
  { id: 'p24', name: 'Bellini - Prosecco (Vino espumoso), Puré o Néctar de Durazno (Melocotón).', category: 'vinos', price: 1 },
  { id: 'p28', name: 'Kir Royal - Vino espumoso (Champagne o Cava), Crème de Cassis (Licor de grosella negra).', category: 'vinos', price: 1 },
  { id: 'p39', name: 'Sangría - Vino (Tinto o Blanco), Licor (Brandy o Triple Seco), Fruta Picada, Azúcar, Refresco.', category: 'vinos', price: 1 },
  { id: 'p40', name: 'Tinto de Verano - Vino Tinto, Gaseosa (o Limonada).', category: 'vinos', price: 1 },
  { id: 'p46', name: 'Aperol Spritz - Aperol, Prosecco (Vino espumoso), Agua con gas (Soda).', category: 'vinos', price: 1 },

  // Licores & Otros
  { id: 'p26', name: 'Long Island Ice Tea - Vodka, Ron Blanco, Tequila, Ginebra, Triple Seco (Licor de Naranja), Jugo de Limón, Jarabe de Azúcar, Coca-Cola.', category: 'otros', price: 1 },
  { id: 'p27', name: 'Caipirinha - Cachaça, Lima, Azúcar.', category: 'otros', price: 1 },
  { id: 'p34', name: 'Pisco Sour - Pisco, Jugo de Limón (o Lima), Jarabe de Azúcar, Clara de Huevo (opcional), Amargo de Angostura.', category: 'otros', price: 1 },
  { id: 'p45', name: 'Americano Coctel - Campari, Vermut Rojo (Dulce), Agua con gas (Soda).', category: 'otros', price: 1 },
];

const PRODUCTS_STORAGE_KEY = 'mamazzitaa-products';

function App() {
  const [page, setPage] = useState<'sala' | 'productos'>('sala');
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      return savedProducts ? JSON.parse(savedProducts) : initialProducts;
    } catch (error) {
      console.error('Error loading products from localStorage:', error);
      return initialProducts;
    }
  });
  const [categories] = useState<Category[]>(initialCategories);

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving products to localStorage:', error);
    }
  }, [products]);

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

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  return (
    <>
      {page === 'sala' && <SalaPage products={products} onNavigate={setPage} />}
      {page === 'productos' && (
          <ProductsPage 
              categories={categories}
              products={products}
              onUpdateProduct={handleUpdateProduct}
              onNavigate={setPage}
          />
      )}
    </>
  );
}

export default App;
