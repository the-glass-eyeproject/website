'use client';

import { useTheme } from './ThemeProvider';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  
  // Call hook at top level - will throw if provider not available
  let theme: 'light' | 'dark' = 'dark';
  let toggleTheme: () => void = () => {};
  
  try {
    const context = useTheme();
    theme = context.theme;
    toggleTheme = context.toggleTheme;
  } catch (error) {
    // Provider not available - return placeholder
    return (
      <div className="flex items-center gap-2">
        <Switch disabled className="opacity-50" />
      </div>
    );
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark';

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Switch disabled className="opacity-50" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sun icon - visible in light mode */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`text-zinc-600 dark:text-zinc-400 transition-all duration-300 ${
          !isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-90'
        }`}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>

      {/* Switch */}
      <Switch
        checked={isDark}
        onCheckedChange={toggleTheme}
        aria-label="Toggle theme"
        className="transition-all duration-300"
      />

      {/* Moon icon - visible in dark mode */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`text-zinc-600 dark:text-zinc-400 transition-all duration-300 ${
          isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 rotate-90'
        }`}
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </div>
  );
}
