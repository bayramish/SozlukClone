'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import Header from './Header';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const isDark = useThemeStore((state) => state.isDark);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark, mounted]);

  // Prevent flash of unstyled content
  if (!mounted) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50 min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-7xl">{children}</main>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen transition-colors duration-300">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">{children}</main>
    </div>
  );
}
