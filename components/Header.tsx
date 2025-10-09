import React from 'react';
import { HouseIcon } from './icons';

const Header: React.FC = () => {
    return (
        <header className="flex items-center space-x-3">
            <HouseIcon className="h-6 w-6 text-gray-700"/>
            <h1 className="text-xl font-bold text-gray-800">Tu Hogar Checklist</h1>
        </header>
    );
};

export default Header;
