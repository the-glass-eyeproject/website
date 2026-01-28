'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="relative p-2.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors group"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100 text-accent' 
              : 'opacity-0 -rotate-90 scale-75 text-accent'
          }`} 
        />
        <Moon 
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100 text-accent' 
              : 'opacity-0 rotate-90 scale-75 text-accent'
          }`} 
        />
      </div>
    </button>
  );
}
