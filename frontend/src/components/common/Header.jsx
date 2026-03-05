import React from 'react';
import { useAuth } from '../../context/AuthContext';
import InstallAppButton from './InstallAppButton';

export default function Header({ title }) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
      <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">{title}</h1>

      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        {/* Install App */}
        <InstallAppButton className="hidden md:inline-flex" />

        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-gray-600 hidden md:block">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-brand-primary flex items-center justify-center text-white font-medium text-xs md:text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
