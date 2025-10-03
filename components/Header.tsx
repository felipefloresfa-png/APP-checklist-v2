
import React from 'react';
import HouseIcon from './icons/HouseIcon';

const Header: React.FC = () => {
  return (
    <header className="flex items-center gap-3 mb-6">
      <HouseIcon className="w-8 h-8 text-green-600" />
      <h1 className="text-3xl font-bold text-slate-800">
        Amoblando Nuestra Casa
      </h1>
    </header>
  );
};

export default Header;
