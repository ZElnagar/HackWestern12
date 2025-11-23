import React from 'react';
import { User } from '../types';
import { User as UserIcon } from 'lucide-react';

interface ProfileButtonProps {
  onClick: () => void;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-md hover:shadow-lg transition-all text-teal-600 dark:text-teal-400 border border-slate-100 dark:border-slate-700"
      title="My Profile"
    >
      <UserIcon size={24} />
    </button>
  );
};

export default ProfileButton;
