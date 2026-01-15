'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UploadForm from '@/components/UploadForm';
import LoginModal from '@/components/LoginModal';
import GoogleDriveConnection from '@/components/GoogleDriveConnection';
import ThemeToggle from '@/components/ThemeToggle';
import { useToast } from '@/hooks/use-toast';

export default function UploadPage() {
  const { toast } = useToast();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkAuth();
    
    // Check for OAuth callback messages
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    
    if (connected === 'true') {
      toast({
        title: 'Success',
        description: 'Google Drive connected successfully!',
      });
      // Clean URL
      setTimeout(() => {
        window.history.replaceState({}, '', '/upload');
      }, 100);
    } else if (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to Google Drive. Please try again.',
        variant: 'destructive',
      });
      // Clean URL
      setTimeout(() => {
        window.history.replaceState({}, '', '/upload');
      }, 100);
    }
  }, [searchParams]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      setAuthenticated(data.authenticated);
      
      if (!data.authenticated) {
        setShowLogin(true);
      }
    } catch (error) {
      setAuthenticated(false);
      setShowLogin(true);
    }
  };

  const handleLoginSuccess = () => {
    setAuthenticated(true);
    checkAuth();
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthenticated(false);
      setShowLogin(true);
      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  if (authenticated === null) {
    return (
      <main className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center transition-colors">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 transition-colors">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-zinc-900 dark:text-zinc-100 mb-2 transition-colors">
              Upload Photo
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm transition-colors">
              Add a new photo to the gallery
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md text-sm font-medium transition-colors border border-zinc-300 dark:border-zinc-700"
            >
              View Gallery
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md text-sm font-medium transition-colors border border-zinc-300 dark:border-zinc-700"
            >
              Logout
            </button>
          </div>
        </header>

        {authenticated ? (
          <>
            <GoogleDriveConnection />
            <UploadForm />
          </>
        ) : (
          <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center transition-colors">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4 transition-colors">Please login to upload photos</p>
            <button
              onClick={() => setShowLogin(true)}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-600 text-white dark:text-zinc-100 rounded-md font-medium transition-colors"
            >
              Login
            </button>
          </div>
        )}

        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      </div>
    </main>
  );
}
