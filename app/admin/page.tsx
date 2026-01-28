'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Upload, Eye, Images, Plus } from 'lucide-react';
import Gallery from '@/components/Gallery';
import EditPhotoModal from '@/components/EditPhotoModal';
import ThemeToggle from '@/components/ThemeToggle';
import { PhotoWithTags } from '@/lib/supabase/types';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<PhotoWithTags | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
      
      setUser(data.user);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast({
        title: 'Logged out',
        description: 'You have been signed out',
      });
      router.push('/');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive',
      });
    }
  };

  const handlePhotoUpdate = () => {
    setRefreshKey(prev => prev + 1);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link href="/" className="inline-block">
                <h1 className="font-display text-3xl sm:text-4xl font-light text-foreground tracking-tight hover:text-accent transition-colors">
                  The Glass Eye
                </h1>
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                Admin Dashboard
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
              <Link
                href="/"
                className="btn-ghost flex items-center gap-2"
              >
                <Eye size={16} />
                <span className="hidden sm:inline">View Site</span>
              </Link>
              
              <Link
                href="/admin/upload"
                className="btn-accent flex items-center gap-2"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Upload</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="btn-ghost flex items-center gap-2 text-muted-foreground"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="mt-4 text-xs text-muted-foreground">
              Signed in as <span className="text-foreground">{user.email}</span>
            </div>
          )}
        </header>

        {/* Quick Stats */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Images size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-display">—</p>
                <p className="text-xs text-muted-foreground">Total Photos</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Eye size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-display">—</p>
                <p className="text-xs text-muted-foreground">Public</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl">All Photos</h2>
            <Link
              href="/admin/upload"
              className="text-sm text-accent hover:underline flex items-center gap-1"
            >
              <Upload size={14} />
              Upload new
            </Link>
          </div>
          
          <Gallery 
            key={refreshKey}
            isAdmin={true} 
            onEditPhoto={setEditingPhoto} 
          />
        </section>
      </div>

      {/* Edit Modal */}
      {editingPhoto && (
        <EditPhotoModal
          photo={editingPhoto}
          isOpen={!!editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onSave={handlePhotoUpdate}
          onDelete={handlePhotoUpdate}
        />
      )}
    </main>
  );
}
