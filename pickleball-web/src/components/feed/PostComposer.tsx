'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useFeedStore } from '@/stores/feedStore';
import { uploadFeedImage } from '@/utils/imageUpload';
import { useToast } from '@/components/ui/Toast';
import { ImagePlus, X } from 'lucide-react';

export default function PostComposer() {
  const { profile } = useAuthStore();
  const { createPost } = useFeedStore();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;
    setPosting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile && profile) {
        imageUrl = await uploadFeedImage(imageFile, profile.id);
      }
      await createPost(content, imageUrl);
      setContent('');
      removeImage();
      showToast('Post created!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create post';
      showToast(message, 'error');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-primary">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none text-sm"
        />
      </div>

      {imagePreview && (
        <div className="relative inline-block">
          <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <ImagePlus className="h-5 w-5" />
          Photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          loading={posting}
          disabled={!content.trim() && !imageFile}
        >
          Post
        </Button>
      </div>
    </div>
  );
}
