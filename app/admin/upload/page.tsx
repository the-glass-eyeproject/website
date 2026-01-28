'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Images } from 'lucide-react';
import UploadForm from '@/components/UploadForm';
import ThemeToggle from '@/components/ThemeToggle';

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      
      if (!data.authenticated) {
        router.push('/login');
        return;
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    // Could stay here for more uploads or redirect
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--gallery-bg))] flex items-center justify-center">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[hsl(var(--gallery-bg))]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <Link 
              href="/admin" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/admin"
                className="btn-ghost flex items-center gap-2"
              >
                <Images size={16} />
                <span className="hidden sm:inline">View Gallery</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Upload Section */}
        <section>
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-2">
              Upload Photo
            </h1>
            <p className="text-muted-foreground">
              Add a new photograph to your gallery
            </p>
          </div>

          <UploadForm onSuccess={handleSuccess} />
        </section>

        {/* Tips */}
        <section className="mt-12 p-6 bg-muted/30 rounded-lg border border-border">
          <h3 className="font-display text-lg mb-3">Tips for great photos</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use high-resolution images for best quality (recommended: 2000px+)</li>
            <li>• Add descriptive titles and tags to help visitors find your work</li>
            <li>• Photos are private by default — toggle to public when ready to share</li>
            <li>• Supported formats: JPEG, PNG, GIF, WebP (max 20MB)</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
