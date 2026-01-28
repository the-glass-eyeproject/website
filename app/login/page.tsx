'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '@/components/LoginForm';
import ThemeToggle from '@/components/ThemeToggle';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          router.push('/admin');
        }
      });
  }, [router]);

  return (
    <main className="min-h-screen bg-[hsl(var(--gallery-bg))] flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back to Gallery</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl text-foreground">
              The Glass Eye
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage your gallery
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-card border border-border rounded-lg p-6 sm:p-8 shadow-sm">
            <LoginForm />
          </div>

          {/* Help text */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Protected area for gallery administrators only
          </p>
        </div>
      </div>
    </main>
  );
}
