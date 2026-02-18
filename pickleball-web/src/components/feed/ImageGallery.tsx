'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % images.length);
  }, [lightboxIndex, images.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  }, [lightboxIndex, images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, goNext, goPrev]);

  if (images.length === 0) return null;

  // Single image: full width
  if (images.length === 1) {
    return (
      <>
        <img
          src={images[0]}
          alt="Post image"
          className="rounded-xl max-h-96 w-full object-cover cursor-pointer"
          onClick={() => openLightbox(0)}
        />
        {lightboxIndex !== null && (
          <Lightbox
            images={images}
            index={lightboxIndex}
            onClose={closeLightbox}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}
      </>
    );
  }

  // 2 images: side by side
  if (images.length === 2) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
          {images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Post image ${i + 1}`}
              className="w-full h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => openLightbox(i)}
            />
          ))}
        </div>
        {lightboxIndex !== null && (
          <Lightbox
            images={images}
            index={lightboxIndex}
            onClose={closeLightbox}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}
      </>
    );
  }

  // 3 images: 1 large + 2 small
  if (images.length === 3) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
          <img
            src={images[0]}
            alt="Post image 1"
            className="w-full h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity row-span-2"
            onClick={() => openLightbox(0)}
          />
          <img
            src={images[1]}
            alt="Post image 2"
            className="w-full h-[calc(8rem-0.125rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => openLightbox(1)}
          />
          <img
            src={images[2]}
            alt="Post image 3"
            className="w-full h-[calc(8rem-0.125rem)] object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => openLightbox(2)}
          />
        </div>
        {lightboxIndex !== null && (
          <Lightbox
            images={images}
            index={lightboxIndex}
            onClose={closeLightbox}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}
      </>
    );
  }

  // 4 images: 2x2 grid
  return (
    <>
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {images.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`Post image ${i + 1}`}
            className="w-full h-40 object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => openLightbox(i)}
          />
        ))}
      </div>
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNext={goNext}
          onPrev={goPrev}
        />
      )}
    </>
  );
}

interface LightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function Lightbox({ images, index, onClose, onNext, onPrev }: LightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      {/* Image */}
      <img
        src={images[index]}
        alt={`Image ${index + 1} of ${images.length}`}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
