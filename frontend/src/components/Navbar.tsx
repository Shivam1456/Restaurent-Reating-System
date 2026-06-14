import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Star, Store, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return (
          <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold leading-none text-rose-400 border border-rose-500/20">
            <Shield size={12} />
            Admin
          </span>
        );
      case 'STORE_OWNER':
        return (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold leading-none text-emerald-400 border border-emerald-500/20">
            <Store size={12} />
            Owner
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold leading-none text-indigo-400 border border-indigo-500/20">
            <Star size={12} />
            User
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div 
          onClick={() => {
            if (user.role === 'SYSTEM_ADMIN') navigate('/admin');
            else if (user.role === 'STORE_OWNER') navigate('/store-owner');
            else navigate('/');
          }}
          className="flex cursor-pointer items-center gap-2 font-bold text-white transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-md">
            <Star className="text-white fill-white" size={18} />
          </div>
          <span className="text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Store<span className="font-extrabold text-indigo-400">Rater</span>
          </span>
        </div>

        {/* Navigation Links for Normal User */}
        {user.role === 'NORMAL_USER' && (
          <nav className="flex items-center gap-5 text-sm font-semibold">
            <button
              onClick={() => navigate('/')}
              className="text-slate-300 hover:text-white hover:underline decoration-indigo-400 decoration-2 underline-offset-4 transition-all focus:outline-none cursor-pointer"
            >
              All Stores
            </button>
            <button
              onClick={() => navigate('/my-ratings')}
              className="text-slate-300 hover:text-white hover:underline decoration-indigo-400 decoration-2 underline-offset-4 transition-all focus:outline-none cursor-pointer"
            >
              My Ratings
            </button>
          </nav>
        )}

        {/* Profile & Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-200">{user.name}</span>
            <span className="text-xs text-slate-400">{user.email}</span>
          </div>

          {getRoleBadge(user.role)}

          <div className="h-6 w-px bg-slate-800" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 hover:border-rose-500/30 bg-slate-950 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-rose-400 transition-all duration-200 focus:outline-none"
            title="Log Out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
