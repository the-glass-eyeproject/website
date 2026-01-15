'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PREDEFINED_TAGS } from '@/lib/tags';
import { useToast } from '@/hooks/use-toast';

interface FileWithPreview {
  file: File;
  preview: string;
  customName: string;
  id: string;
}

export default function UploadForm() {
  const { toast } = useToast();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: FileWithPreview[] = Array.from(e.target.files).map((file) => {
        const preview = URL.createObjectURL(file);
        return {
          file,
          preview,
          customName: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for custom name
          id: Math.random().toString(36).substring(7),
        };
      });
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const updateFileName = (id: string, newName: string) => {
    setFiles(prev =>
      prev.map(f => f.id === id ? { ...f, customName: newName } : f)
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload files sequentially
      let successCount = 0;
      let errorCount = 0;

      for (const fileWithPreview of files) {
        try {
          const formData = new FormData();
          formData.append('file', fileWithPreview.file);
          formData.append('tags', JSON.stringify(selectedTags));
          formData.append('customName', fileWithPreview.customName);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
              toast({
                title: 'Unauthorized',
                description: 'Please login first',
                variant: 'destructive',
              });
              setTimeout(() => {
                window.location.href = '/upload';
              }, 1500);
              return;
            }
            throw new Error(errorData.error || 'Upload failed');
          }

          successCount++;
        } catch (err) {
          errorCount++;
          console.error(`Failed to upload ${fileWithPreview.file.name}:`, err);
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `${successCount} photo(s) uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        });
      } else {
        toast({
          title: 'Upload Failed',
          description: 'All uploads failed',
          variant: 'destructive',
        });
        return;
      }

      // Clean up preview URLs
      files.forEach(f => URL.revokeObjectURL(f.preview));
      
      setFiles([]);
      setSelectedTags([]);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh gallery
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast({
        title: 'Upload Failed',
        description: err instanceof Error ? err.message : 'Upload failed',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-8 transition-colors">
      <h2 className="text-xl font-light text-zinc-900 dark:text-zinc-100 mb-4 transition-colors">Upload Photos</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="file-input"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 transition-colors"
          >
            Select Photos (Multiple allowed)
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-zinc-200 dark:file:bg-zinc-800 file:text-zinc-900 dark:file:text-zinc-200 hover:file:bg-zinc-300 dark:hover:file:bg-zinc-700 cursor-pointer transition-colors"
          />
        </div>

        {/* File Previews */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-colors">
              Selected Photos ({files.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((fileWithPreview) => (
                <div
                  key={fileWithPreview.id}
                  className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 space-y-2 transition-colors"
                >
                  <div className="relative aspect-square rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                    <Image
                      src={fileWithPreview.preview}
                      alt={fileWithPreview.file.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        File Name
                      </label>
                      <input
                        type="text"
                        value={fileWithPreview.customName}
                        onChange={(e) => updateFileName(fileWithPreview.id, e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-600 transition-colors"
                        placeholder="Enter file name"
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                        Original: {fileWithPreview.file.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(fileWithPreview.id)}
                      className="w-full py-1.5 px-3 text-xs bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 rounded-md font-medium transition-colors border border-red-200 dark:border-red-900/50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3 transition-colors">
            Tags (select one or more)
          </label>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map((tag, index) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors relative ${
                  selectedTags.includes(tag)
                    ? selectedTags.indexOf(tag) === 0 && selectedTags.length > 1
                      ? 'bg-zinc-800 dark:bg-zinc-600 text-zinc-100 border-2 border-zinc-900 dark:border-zinc-500'
                      : 'bg-zinc-700 dark:bg-zinc-700 text-zinc-100 border border-zinc-600 dark:border-zinc-600'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-750 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
                title={selectedTags.indexOf(tag) === 0 && selectedTags.length > 1 ? 'Primary tag - photo will be uploaded to this folder' : ''}
              >
                {tag}
                {selectedTags.indexOf(tag) === 0 && selectedTags.length > 1 && (
                  <span className="ml-1 text-xs">*</span>
                )}
              </button>
            ))}
          </div>
          {selectedTags.length > 1 && (
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 transition-colors">
              <span className="font-medium">Note:</span> Photo will be uploaded to the <span className="font-medium">"{selectedTags[0]}"</span> folder (first tag). All tags will be saved for filtering.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={files.length === 0 || uploading}
          className="w-full py-2.5 px-4 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white dark:text-zinc-100 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-800 dark:border-zinc-700"
        >
          {uploading ? `Uploading ${files.length} photo(s)...` : `Upload ${files.length > 0 ? `${files.length} ` : ''}Photo(s)`}
        </button>
      </form>
    </div>
  );
}
