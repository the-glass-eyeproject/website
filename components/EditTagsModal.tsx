'use client';

import { useState, useEffect } from 'react';
import { PREDEFINED_TAGS } from '@/lib/tags';
import { useToast } from '@/hooks/use-toast';

interface EditTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoId: string;
  currentTags: string[];
  onSuccess: () => void;
}

export default function EditTagsModal({
  isOpen,
  onClose,
  photoId,
  currentTags,
  onSuccess,
}: EditTagsModalProps) {
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedTags(currentTags);
    }
  }, [isOpen, currentTags]);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/photos/${photoId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags: selectedTags }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tags');
      }

      toast({
        title: 'Success',
        description: 'Tags updated successfully',
      });

      onSuccess();
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update tags',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 w-full max-w-md transition-colors">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-light text-zinc-900 dark:text-zinc-100 transition-colors">
            Edit Tags
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 transition-colors">
              Select Tags
            </label>
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
              {PREDEFINED_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-zinc-700 dark:bg-zinc-700 text-zinc-100 border border-zinc-600 dark:border-zinc-600'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-750 hover:text-zinc-900 dark:hover:text-zinc-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 transition-colors">
                Selected: {selectedTags.join(', ')}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md font-medium transition-colors border border-zinc-300 dark:border-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-zinc-900 dark:bg-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-600 text-white dark:text-zinc-100 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-800 dark:border-zinc-600"
            >
              {loading ? 'Saving...' : 'Save Tags'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
