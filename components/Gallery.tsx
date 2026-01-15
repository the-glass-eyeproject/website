'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PREDEFINED_TAGS } from '@/lib/tags';
import { useToast } from '@/hooks/use-toast';
import EditTagsModal from './EditTagsModal';

interface Photo {
  id: string;
  filename: string;
  url: string;
  tags: string[];
  uploadedAt: string;
}

export default function Gallery() {
  const router = useRouter();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      setFilteredPhotos(photos.filter(p => p.tags.includes(selectedTag)));
    } else {
      setFilteredPhotos(photos);
    }
  }, [selectedTag, photos]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos');
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
        setFilteredPhotos(data);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Photo deleted successfully',
        });
        fetchPhotos();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete photo');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-zinc-600 dark:text-zinc-400 transition-colors">
        Loading gallery...
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-600 dark:text-zinc-400 transition-colors">
        <p className="text-lg mb-2">No photos yet</p>
        <p className="text-sm">Upload your first photo to get started</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-light text-zinc-900 dark:text-zinc-100 transition-colors">
          Gallery {selectedTag && `- ${selectedTag}`}
        </h2>
        <div className="flex items-center gap-3">
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 underline transition-colors"
            >
              Clear filter
            </button>
          )}
          <button
            onClick={() => router.push('/upload')}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md text-sm font-medium transition-colors border border-zinc-300 dark:border-zinc-700"
          >
            Upload Photo
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {PREDEFINED_TAGS.map(tag => {
          const count = photos.filter(p => p.tags.includes(tag)).length;
          if (count === 0) return null;
          
          return (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedTag === tag
                  ? 'bg-zinc-700 dark:bg-zinc-700 text-zinc-100 border border-zinc-600 dark:border-zinc-600'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-300'
              }`}
            >
              {tag} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map(photo => (
          <div
            key={photo.id}
            className="group relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div className="aspect-square relative overflow-hidden">
              <Image
                src={photo.url}
                alt={photo.filename}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
            
            <div className="p-3">
              <div className="flex flex-wrap gap-1 mb-2">
                {photo.tags.map((tag, index) => (
                  <span
                    key={tag}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                      index === 0 && photo.tags.length > 1
                        ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'
                    }`}
                    title={index === 0 && photo.tags.length > 1 ? 'Primary tag (folder location)' : ''}
                  >
                    {tag}
                    {index === 0 && photo.tags.length > 1 && ' *'}
                  </span>
                ))}
                {photo.tags.length === 0 && (
                  <span className="text-xs px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 rounded">
                    Untagged
                  </span>
                )}
              </div>
              
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2 truncate transition-colors">
                {photo.filename}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPhoto(photo)}
                  className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 underline transition-colors"
                >
                  Edit Tags
                </button>
                <span className="text-zinc-400 dark:text-zinc-600">•</span>
                <button
                  onClick={() => handleDelete(photo.id)}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPhotos.length === 0 && selectedTag && (
        <div className="text-center py-12 text-zinc-600 dark:text-zinc-400 transition-colors">
          No photos found with tag "{selectedTag}"
        </div>
      )}

      {editingPhoto && (
        <EditTagsModal
          isOpen={!!editingPhoto}
          onClose={() => setEditingPhoto(null)}
          photoId={editingPhoto.id}
          currentTags={editingPhoto.tags}
          onSuccess={() => {
            fetchPhotos();
            setEditingPhoto(null);
          }}
        />
      )}
    </div>
  );
}
