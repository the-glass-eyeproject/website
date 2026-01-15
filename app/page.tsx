'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Gallery from "@/components/Gallery";
import ThemeToggle from "@/components/ThemeToggle";
import LoginModal from "@/components/LoginModal";

export default function Home() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [hasGoogleDriveTokens, setHasGoogleDriveTokens] = useState<boolean | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    checkAuth();
    checkGoogleDriveTokens();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setAuthenticated(data.authenticated);
    } catch (error) {
      setAuthenticated(false);
    }
  };

  const checkGoogleDriveTokens = async () => {
    try {
      const response = await fetch('/api/auth/google/token-status');
      const data = await response.json();
      setHasGoogleDriveTokens(data.hasTokens);
    } catch (error) {
      setHasGoogleDriveTokens(false);
    }
  };

  const handleLoginSuccess = () => {
    setAuthenticated(true);
    checkAuth();
    checkGoogleDriveTokens();
  };

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-light text-zinc-900 dark:text-zinc-100 mb-2 transition-colors">
              The Glass Eye Project
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm transition-colors">
              A minimalistic photo gallery with intelligent tagging
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            {authenticated === false && (
              <button
                onClick={() => setShowLogin(true)}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-600 text-white dark:text-zinc-100 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </button>
            )}
            {authenticated === true && hasGoogleDriveTokens === false && (
              <button
                onClick={() => router.push('/upload')}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-600 text-white dark:text-zinc-100 rounded-md text-sm font-medium transition-colors"
              >
                Connect Google Drive
              </button>
            )}
            {authenticated === true && hasGoogleDriveTokens === true && (
              <button
                onClick={() => router.push('/upload')}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md text-sm font-medium transition-colors border border-zinc-300 dark:border-zinc-700"
              >
                Upload
              </button>
            )}
          </div>
        </header>

        <Gallery />

        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      </div>
    </main>
  );
}
