'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useFeedStore } from '@/stores/feedStore';
import { uploadFeedImage } from '@/utils/imageUpload';
import { useToast } from '@/components/ui/Toast';
import { Club } from '@/types/database';
import { ImagePlus, X, Users } from 'lucide-react';

const MAX_IMAGES = 4;

interface PostComposerProps {
  clubs: Club[];
  fixedClubId?: string;
}

export default function PostComposer({ clubs, fixedClubId }: PostComposerProps) {
  const { profile } = useAuthStore();
  const { createPost } = useFeedStore();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [clubId, setClubId] = useState(fixedClubId || '');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, remaining);

    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);

    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImageFiles([]);
    setImagePreviews([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async () => {
    const targetClubId = fixedClubId || clubId;
    if (!content.trim() && imageFiles.length === 0) return;
    if (!targetClubId) {
      showToast('Please select a club', 'error');
      return;
    }
    setPosting(true);
    try {
      let imageUrls: string[] = [];
      if (imageFiles.length > 0 && profile) {
        imageUrls = await Promise.all(
          imageFiles.map((file) => uploadFeedImage(file, profile.id))
        );
      }
      await createPost(content, imageUrls, targetClubId);
      setContent('');
      clearAllImages();
      showToast('Post created!', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create post';
      showToast(message, 'error');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] border border-border/30">
      {/* Club selector (only if not fixed to a club) */}
      {!fixedClubId && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-text-tertiary" />
          <select
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            className="flex-1 px-3 py-2 bg-background/60 border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          >
            <option value="">Post to a club...</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3 min-w-0">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
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
          className="flex-1 min-w-0 bg-background/60 border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none transition-all"
        />
      </div>

      {/* Image previews grid */}
      {imagePreviews.length > 0 && (
        <div className={`grid gap-2 ${
          imagePreviews.length === 1 ? 'grid-cols-1' :
          imagePreviews.length === 2 ? 'grid-cols-2' :
          'grid-cols-2'
        }`}>
          {imagePreviews.map((preview, index) => (
            <div
              key={index}
              className={`relative ${
                imagePreviews.length === 3 && index === 0 ? 'col-span-2' : ''
              }`}
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 rounded-xl object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={imageFiles.length >= MAX_IMAGES}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ImagePlus className="h-5 w-5" />
          Photo {imageFiles.length > 0 && `(${imageFiles.length}/${MAX_IMAGES})`}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          loading={posting}
          disabled={!content.trim() && imageFiles.length === 0}
        >
          Post
        </Button>
      </div>
    </div>
  );
}
