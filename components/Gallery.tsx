'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Download, Eye, EyeOff, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoWithTags | null>(null);
  const [lightboxImageLoaded, setLightboxImageLoaded] = useState(false);

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

  // Lightbox functions
  const openLightbox = (photo: PhotoWithTags) => {
    setLightboxPhoto(photo);
    setLightboxImageLoaded(false);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = useCallback(() => {
    setLightboxPhoto(null);
    setLightboxImageLoaded(false);
    document.body.style.overflow = '';
  }, []);

  const navigateLightbox = useCallback((direction: 'prev' | 'next') => {
    if (!lightboxPhoto) return;
    const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id);
    const newIndex = direction === 'next' 
      ? (currentIndex + 1) % photos.length
      : (currentIndex - 1 + photos.length) % photos.length;
    setLightboxPhoto(photos[newIndex]);
    setLightboxImageLoaded(false);
  }, [lightboxPhoto, photos]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxPhoto) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') navigateLightbox('next');
      if (e.key === 'ArrowLeft') navigateLightbox('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto, closeLightbox, navigateLightbox]);

  // Fixed heights for skeleton loading to avoid hydration mismatch
  const skeletonHeights = [280, 350, 240, 320, 300, 260, 380, 290];

  if (loading) {
    return (
      <div className="masonry-grid">
        {skeletonHeights.map((height, i) => (
          <div key={i} className="masonry-item">
            <div 
              className="skeleton w-full rounded"
              style={{ height: `${height}px` }}
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
            <div 
              className="image-card group cursor-pointer"
              onClick={() => openLightbox(photo)}
            >
              {/* Image */}
              <div 
                className="relative"
                onContextMenu={(e) => {
                  // Disable right-click on images for non-admin
                  if (!isAdmin) {
                    e.preventDefault();
                  }
                }}
              >
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
                  draggable={false}
                />
                
                {/* Watermark overlay - visible on all public images */}
                {!isAdmin && (
                  <>
                    <div className="image-watermark" />
                    <div className="watermark-pattern" />
                  </>
                )}
                
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

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={28} />
          </button>

          {/* Navigation - Previous */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
              className="absolute left-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft size={36} />
            </button>
          )}

          {/* Navigation - Next */}
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
              className="absolute right-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight size={36} />
            </button>
          )}

          {/* Image container */}
          <div 
            className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => { if (!isAdmin) e.preventDefault(); }}
          >
            {/* Loading spinner */}
            {!lightboxImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="spinner w-8 h-8" />
              </div>
            )}

            <Image
              src={lightboxPhoto.storage_url}
              alt={lightboxPhoto.title || lightboxPhoto.filename}
              width={lightboxPhoto.width || 1920}
              height={lightboxPhoto.height || 1080}
              className={`max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain transition-opacity duration-300 ${
                lightboxImageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setLightboxImageLoaded(true)}
              priority
              draggable={false}
            />

            {/* Watermark overlay for public users */}
            {!isAdmin && (
              <>
                <div className="absolute inset-0 image-watermark pointer-events-none" />
                <div className="absolute inset-0 watermark-pattern pointer-events-none" />
              </>
            )}
          </div>

          {/* Photo info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="max-w-3xl mx-auto text-center">
              {lightboxPhoto.title && (
                <h3 className="font-display text-2xl text-white mb-2">
                  {lightboxPhoto.title}
                </h3>
              )}
              {lightboxPhoto.description && (
                <p className="text-white/70 text-sm mb-4 max-w-xl mx-auto">
                  {lightboxPhoto.description}
                </p>
              )}
              
              {/* Tags */}
              {lightboxPhoto.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {lightboxPhoto.tags.map(tag => (
                    <span 
                      key={tag.id}
                      className="text-xs text-white/60 bg-white/10 px-3 py-1 rounded"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Download button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(lightboxPhoto);
                }}
                className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>

          {/* Photo counter */}
          {photos.length > 1 && (
            <div className="absolute top-4 left-4 text-white/50 text-sm">
              {photos.findIndex(p => p.id === lightboxPhoto.id) + 1} / {photos.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
