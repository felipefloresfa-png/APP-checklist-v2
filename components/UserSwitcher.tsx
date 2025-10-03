
import React from 'react';
import { User } from '../types';
import UserIcon from './icons/UserIcon';

interface UserSwitcherProps {
  activeUser: User;
  onUserChange: (user: User) => void;
}

const UserSwitcher: React.FC<UserSwitcherProps> = ({ activeUser, onUserChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2 bg-slate-200 p-1 rounded-xl">
      <button
        onClick={() => onUserChange(User.FELIPE)}
        className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-colors duration-300 ${
          activeUser === User.FELIPE 
          ? 'bg-indigo-600 text-white shadow' 
          : 'bg-transparent text-slate-600 hover:bg-slate-300'
        }`}
      >
        <UserIcon className="w-5 h-5" />
        {User.FELIPE}
      </button>
      <button
        onClick={() => onUserChange(User.VALERIA)}
        className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-colors duration-300 ${
          activeUser === User.VALERIA 
          ? 'bg-red-500 text-white shadow' 
          : 'bg-transparent text-slate-600 hover:bg-slate-300'
        }`}
      >
        <UserIcon className="w-5 h-5" />
        {User.VALERIA}
      </button>
    </div>
  );
};

export default UserSwitcher;
