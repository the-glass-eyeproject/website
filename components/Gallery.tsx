'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, Eye, EyeOff } from 'lucide-react';
import { PhotoWithTags, Tag } from '@/lib/supabase/types';

interface GalleryProps {
  isAdmin?: boolean;
  onEditPhoto?: (photo: PhotoWithTags) => void;
}

export default function Gallery({ isAdmin = false, onEditPhoto }: GalleryProps) {
  const [photos, setPhotos] = useState<PhotoWithTags[]>([]);
  const [tags, setTags] = useState<(Tag & { count: number })[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPhotos();
    fetchTags();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedTag) {
      fetchPhotos(selectedTag);
    } else {
      fetchPhotos();
    }
  }, [selectedTag]);

  const fetchPhotos = async (tag?: string) => {
    try {
      const params = new URLSearchParams();
      if (tag) params.set('tag', tag);
      if (isAdmin) params.set('includePrivate', 'true');
      
      const response = await fetch(`/api/photos?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data.filter((t: Tag & { count: number }) => t.count > 0));
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handleDownload = async (photo: PhotoWithTags) => {
    try {
      const response = await fetch(`/api/photos/${photo.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = photo.title || `glasseye_${photo.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="masonry-grid">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="masonry-item">
            <div 
              className="skeleton w-full rounded"
              style={{ height: `${200 + Math.random() * 200}px` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="font-display text-3xl text-muted-foreground mb-3">
          {selectedTag ? 'No photographs found' : 'The gallery awaits'}
        </div>
        <p className="text-muted-foreground text-sm">
          {selectedTag 
            ? `No images tagged with "${selectedTag}" yet`
            : 'Photographs will appear here once uploaded'
          }
        </p>
        {selectedTag && (
          <button
            onClick={() => setSelectedTag(null)}
            className="mt-4 text-accent hover:underline text-sm"
          >
            Clear filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`tag-pill ${!selectedTag ? 'tag-pill-active' : 'tag-pill-outline'}`}
          >
            All
          </button>
          {tags.map(tag => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(selectedTag === tag.slug ? null : tag.slug)}
              className={`tag-pill ${selectedTag === tag.slug ? 'tag-pill-active' : 'tag-pill-outline'}`}
            >
              {tag.name}
              <span className="ml-1.5 opacity-60">{tag.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Masonry Grid */}
      <div className="masonry-grid">
        {photos.map((photo) => (
          <div 
            key={photo.id} 
            className="masonry-item"
          >
            <div className="image-card group cursor-pointer">
              {/* Image */}
              <div className="relative">
                {!imageLoaded[photo.id] && (
                  <div 
                    className="skeleton absolute inset-0"
                    style={{ 
                      paddingBottom: photo.height && photo.width 
                        ? `${(photo.height / photo.width) * 100}%` 
                        : '75%' 
                    }}
                  />
                )}
                <Image
                  src={photo.storage_url}
                  alt={photo.title || photo.filename}
                  width={photo.width || 800}
                  height={photo.height || 600}
                  className={`w-full h-auto transition-opacity duration-300 ${
                    imageLoaded[photo.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(prev => ({ ...prev, [photo.id]: true }))}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
                
                {/* Visibility indicator for admin */}
                {isAdmin && (
                  <div className={`absolute top-3 left-3 p-1.5 rounded-full ${
                    photo.is_public 
                      ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                      : 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                  }`}>
                    {photo.is_public ? <Eye size={14} /> : <EyeOff size={14} />}
                  </div>
                )}

                {/* Overlay */}
                <div className="image-overlay" />
                
                {/* Info overlay */}
                <div className="image-info">
                  {photo.title && (
                    <h3 className="font-display text-xl text-white mb-1">
                      {photo.title}
                    </h3>
                  )}
                  {photo.description && (
                    <p className="text-white/80 text-sm line-clamp-2 mb-3">
                      {photo.description}
                    </p>
                  )}
                  
                  {/* Tags */}
                  {photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {photo.tags.slice(0, 3).map(tag => (
                        <span 
                          key={tag.id}
                          className="text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {photo.tags.length > 3 && (
                        <span className="text-xs text-white/50">
                          +{photo.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(photo);
                      }}
                      className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white transition-colors"
                    >
                      <Download size={14} />
                      Download
                    </button>
                    {isAdmin && onEditPhoto && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPhoto(photo);
                        }}
                        className="text-xs text-white/90 hover:text-white transition-colors ml-auto"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
