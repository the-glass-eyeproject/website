'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Gallery from '@/components/Gallery';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  };

  return (
    <main className="min-h-screen bg-[hsl(var(--gallery-bg))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-12 sm:mb-16">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-foreground tracking-tight">
                The Glass Eye
              </h1>
              <p className="mt-3 text-muted-foreground text-sm sm:text-base max-w-md">
                A curated collection of photographs, 
                <span className="hidden sm:inline"> captured through a lens of quiet observation</span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated === true && (
                <button
                  onClick={() => router.push('/admin')}
                  className="btn-ghost text-sm"
                >
                  Admin
                </button>
              )}
              {isAuthenticated === false && (
                <button
                  onClick={() => router.push('/login')}
                  className="btn-ghost text-sm"
                >
                  Login
                </button>
              )}
            </div>
          </div>
          
          {/* Decorative line */}
          <div className="mt-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Gallery</span>
            <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
          </div>
        </header>

        {/* Gallery */}
        <Gallery />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} The Glass Eye Project</p>
            <p className="font-display italic">
              "Every photograph is a secret about a secret"
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
