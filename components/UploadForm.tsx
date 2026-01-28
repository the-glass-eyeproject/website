'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { Tag } from '@/lib/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface UploadFormProps {
  onSuccess?: () => void;
}

export default function UploadForm({ onSuccess }: UploadFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

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

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPEG, PNG, GIF, or WebP image',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 20MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
    
    // Auto-fill title from filename
    const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
    setTitle(nameWithoutExt.replace(/[-_]/g, ' '));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Step 1: Upload file to storage
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();

      // Step 2: Create photo record
      const photoResponse = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          description: description || null,
          filename: file.name,
          storage_key: uploadResult.storage_key,
          storage_url: uploadResult.storage_url,
          width: uploadResult.width,
          height: uploadResult.height,
          size: uploadResult.size,
          mime_type: uploadResult.mime_type,
          is_public: isPublic,
          tags: selectedTags,
        }),
      });

      if (!photoResponse.ok) {
        throw new Error('Failed to create photo record');
      }

      toast({
        title: 'Upload complete',
        description: 'Your photo has been uploaded successfully',
      });

      // Reset form
      setFile(null);
      setPreview(null);
      setTitle('');
      setDescription('');
      setIsPublic(false);
      setSelectedTags([]);
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleTag = (slug: string) => {
    setSelectedTags(prev => 
      prev.includes(slug)
        ? prev.filter(t => t !== slug)
        : [...prev, slug]
    );
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Drop Zone */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-all duration-200
            ${dragOver 
              ? 'border-accent bg-accent/5' 
              : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          
          <div className="flex flex-col items-center">
            <div className={`
              p-4 rounded-full mb-4 transition-colors
              ${dragOver ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}
            `}>
              <Upload size={32} />
            </div>
            <p className="font-display text-xl text-foreground mb-2">
              Drop your image here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              JPEG, PNG, GIF, WebP • Max 20MB
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden bg-muted">
            <img
              src={preview!}
              alt="Preview"
              className="w-full max-h-96 object-contain"
            />
            <button
              onClick={clearFile}
              className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="input-label">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your photo a title..."
                className="input"
              />
            </div>

            {/* Description */}
            <div>
              <label className="input-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description that will appear on hover..."
                rows={3}
                className="input resize-none"
              />
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Eye size={20} className="text-green-600 dark:text-green-400" />
                ) : (
                  <EyeOff size={20} className="text-orange-600 dark:text-orange-400" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {isPublic ? 'Public' : 'Private'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPublic 
                      ? 'Visible to everyone' 
                      : 'Only visible to you'
                    }
                  </p>
                </div>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

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

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-accent w-full flex items-center justify-center gap-2 py-3"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <ImageIcon size={18} />
                Upload Photo
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
