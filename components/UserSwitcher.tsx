import * as React from 'react';
import { User } from '../types';
import { UserIcon } from './icons';

const UserSwitcher: React.FC<{ currentUser: User; onUserChange: (user: User) => void; }> = ({ currentUser, onUserChange }) => {
  return (
    <div className="flex items-center space-x-1 bg-gray-200 p-1 rounded-full shadow-inner">
      {Object.values(User).map((user) => {
        const isActive = currentUser === user;
        const activeClass = user === User.FELIPE
          ? 'bg-indigo-600 text-white'
          : 'bg-pink-500 text-white';

        return (
          <button
            key={user}
            onClick={() => onUserChange(user)}
            className={`flex items-center justify-center space-x-2 px-6 py-2 text-sm font-semibold rounded-full transition-all duration-300 focus:outline-none ${
              isActive ? `${activeClass} shadow-md` : 'text-gray-600 hover:bg-gray-300/50'
            }`}
          >
            <UserIcon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
            <span>{user}</span>
          </button>
        );
      })}
    </div>
  );
};

export default UserSwitcher;