'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { PhotoWithTags, Tag } from '@/lib/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface EditPhotoModalProps {
  photo: PhotoWithTags;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export default function EditPhotoModal({ 
  photo, 
  isOpen, 
  onClose, 
  onSave,
  onDelete 
}: EditPhotoModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(photo.title || '');
  const [description, setDescription] = useState(photo.description || '');
  const [isPublic, setIsPublic] = useState(photo.is_public);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    photo.tags.map(t => t.slug)
  );
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    setTitle(photo.title || '');
    setDescription(photo.description || '');
    setIsPublic(photo.is_public);
    setSelectedTags(photo.tags.map(t => t.slug));
  }, [photo]);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          description: description || null,
          is_public: isPublic,
          tags: selectedTags,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Saved',
          description: 'Photo updated successfully',
        });
        onSave();
        onClose();
      } else {
        throw new Error('Failed to update');
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update photo',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this photo? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/photos/${photo.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Deleted',
          description: 'Photo deleted successfully',
        });
        onDelete();
        onClose();
      } else {
        throw new Error('Failed to delete');
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const toggleTag = (slug: string) => {
    setSelectedTags(prev => 
      prev.includes(slug)
        ? prev.filter(t => t !== slug)
        : [...prev, slug]
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content w-full max-w-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">Edit Photo</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6 rounded overflow-hidden bg-muted">
          <img
            src={photo.storage_url}
            alt={photo.title || photo.filename}
            className="w-full h-48 object-cover"
          />
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="input-label">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title..."
              className="input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="input-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="input resize-none"
            />
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Eye size={18} className="text-green-600 dark:text-green-400" />
              ) : (
                <EyeOff size={18} className="text-orange-600 dark:text-orange-400" />
              )}
              <span className="text-sm font-medium">
                {isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            {isPublic 
              ? 'This photo is visible to everyone' 
              : 'Only you can see this photo'
            }
          </p>

          {/* Tags */}
          <div>
            <label className="input-label mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.slug)}
                  className={`tag-pill ${
                    selectedTags.includes(tag.slug) 
                      ? 'tag-pill-active' 
                      : 'tag-pill-outline'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-destructive hover:text-destructive/80 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Delete Photo
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-accent flex items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
