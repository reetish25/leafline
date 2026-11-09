import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, Shield, User, LogOut, LayoutDashboard, History, ScanLine } from 'lucide-react';

export default function Navbar({ activeView, setActiveView }) {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="bg-pine text-paper shadow-sm border-b border-pine-dark sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveView(isAdmin ? 'admin-dashboard' : 'pipeline')}
          >
            <div className="w-10 h-10 rounded-xl bg-moss flex items-center justify-center shadow-inner text-paper group-hover:scale-105 transition-transform duration-150">
              <Leaf className="w-6 h-6 transform -rotate-12" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-2xl tracking-tight text-paper">
                Leafline
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-pine-dark text-moss-light border border-moss/30 font-semibold">
                Helianthus Agronomics
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {/* Diagnostic Pipeline View */}
            <button
              onClick={() => setActiveView('pipeline')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all duration-150 ${
                activeView === 'pipeline'
                  ? 'bg-moss text-paper shadow-sm'
                  : 'text-paper/80 hover:text-paper hover:bg-pine-light'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span>Diagnostic Scan</span>
            </button>

            {/* Scan History View */}
            <button
              onClick={() => setActiveView('history')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-heading font-semibold transition-all duration-150 ${
                activeView === 'history'
                  ? 'bg-moss text-paper shadow-sm'
                  : 'text-paper/80 hover:text-paper hover:bg-pine-light'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden xs:inline">Scan History</span>
              <span className="xs:hidden">History</span>
            </button>

            {/* Admin Switcher */}
            {isAdmin && (
              <button
                onClick={() => setActiveView(activeView.startsWith('admin-') ? 'pipeline' : 'admin-dashboard')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-heading font-bold border transition-all duration-150 ${
                  activeView.startsWith('admin-')
                    ? 'bg-amber text-ink border-amber-light shadow-sm'
                    : 'border-amber/50 text-amber-light hover:bg-amber/15'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{activeView.startsWith('admin-') ? 'Grower View' : 'Admin Console'}</span>
              </button>
            )}

            {/* Profile */}
            <button
              onClick={() => setActiveView('profile')}
              className={`p-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                activeView === 'profile'
                  ? 'bg-pine-dark text-paper border border-moss/40'
                  : 'text-paper/80 hover:text-paper hover:bg-pine-light'
              }`}
              title="Profile & Location Settings"
            >
              <User className="w-4 h-4" />
            </button>

            {/* Separator */}
            <div className="h-5 w-px bg-pine-light hidden sm:block"></div>

            {/* Role Badge & Logout */}
            <div className="flex items-center space-x-2 pl-1">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider ${
                isAdmin ? 'bg-deeprust text-paper' : 'bg-moss-dark text-paper'
              }`}>
                {user?.role}
              </span>

              <button
                onClick={logout}
                className="p-1.5 text-paper/70 hover:text-rust-light hover:bg-pine-light rounded-xl transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
