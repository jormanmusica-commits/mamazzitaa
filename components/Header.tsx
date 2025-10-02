import React from 'react';

interface HeaderProps {
  currentPage: 'sala' | 'productos';
  onNavigate: (page: 'sala' | 'productos') => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const getButtonClasses = (page: 'sala' | 'productos') => {
    const baseClasses = "flex-1 py-3 text-center font-bold text-lg rounded-t-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";
    if (currentPage === page) {
      return `${baseClasses} bg-gray-900 text-purple-400 -mb-[2px] border-b-2 border-transparent`;
    }
    return `${baseClasses} bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white`;
  };

  return (
    <header className="sticky top-0 z-40 bg-gray-900 shadow-md">
      <div className="text-center pt-6 pb-2">
         <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Sala Mamazzita
        </h1>
      </div>
      <nav className="flex justify-center container mx-auto px-2 sm:px-4 md:px-6 mt-4">
        <div className="flex w-full max-w-sm border-b-2 border-gray-700">
          <button onClick={() => onNavigate('sala')} className={getButtonClasses('sala')}>
            Sala
          </button>
          <button onClick={() => onNavigate('productos')} className={getButtonClasses('productos')}>
            Productos
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;