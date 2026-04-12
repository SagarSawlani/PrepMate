'use client';

import { useState } from 'react';
import { useAppStore, useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, BookOpen, Building2 } from 'lucide-react';
import Link from 'next/link';

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentPage, setCurrentPage, clearChat } = useAppStore();
  const { logout, user } = useAuthStore();

  const handleNavigation = (page: 'know-exam' | 'explore-college') => {
    setCurrentPage(page);
    clearChat();
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-primary text-primary-foreground lg:hidden"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 z-30 lg:relative lg:translate-x-0 shadow-lg ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-2xl font-bold text-sidebar-primary">PrepMate</h1>
            <p className="text-xs text-sidebar-foreground/60 mt-1">Exam Preparation</p>
          </div>

          {/* User Info */}
          <div className="mb-8 p-4 bg-sidebar-accent/10 rounded-xl border border-sidebar-border/50 animate-in fade-in slide-in-from-left-4 duration-500 delay-100 shadow-sm">
            <p className="text-sm font-medium text-sidebar-foreground">{user?.name}</p>
            <p className="text-xs text-sidebar-foreground/60 mt-1">{user?.email}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
            <button
              onClick={() => handleNavigation('know-exam')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentPage === 'know-exam'
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
              }`}
            >
              <BookOpen size={20} />
              <span className="font-medium">Know Your Exam</span>
            </button>

            <button
              onClick={() => handleNavigation('explore-college')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentPage === 'explore-college'
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
              }`}
            >
              <Building2 size={20} />
              <span className="font-medium">Explore a College</span>
            </button>
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-all duration-200 shadow-sm hover:shadow-md animate-in fade-in slide-in-from-left-4 duration-500 delay-300"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
