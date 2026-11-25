
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface ProjectImageGalleryProps {
  projectName: string;
  images: string[];
}

export function ProjectImageGallery({ projectName, images }: ProjectImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const closeGallery = () => setSelectedIndex(null);
  const showNext = () => setSelectedIndex((current) => current === null ? 0 : (current + 1) % images.length);
  const showPrevious = () => setSelectedIndex((current) => current === null ? images.length - 1 : (current - 1 + images.length) % images.length);

  // Lock background scroll and restore the original scroll position.
  useEffect(() => {
    if (selectedIndex === null) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const originalPaddingRight = body.style.paddingRight;
    const originalBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const originalHtmlOverflow = html.style.overflow;
    const computedPaddingRight = parseFloat(getComputedStyle(body).paddingRight) || 0;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
    html.style.overflow = "hidden";

    return () => {
      body.style.position = originalBodyStyles.position;
      body.style.top = originalBodyStyles.top;
      body.style.left = originalBodyStyles.left;
      body.style.right = originalBodyStyles.right;
      body.style.width = originalBodyStyles.width;
      body.style.overflow = originalBodyStyles.overflow;
      body.style.paddingRight = originalPaddingRight;
      html.style.overflow = originalHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [selectedIndex]);

  // Keyboard controls.
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeGallery();
      if (event.key === "ArrowRight") showNext();
      if (event.key === "ArrowLeft") showPrevious();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, images.length]);

  if (!images.length) return null;

  const currentIndex = selectedIndex === null ? 0 : selectedIndex % images.length;

  const arrowButtonClass = "absolute top-1/2 z-30 flex h-12 w-12 shrink-0 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/75 text-white shadow-lg transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-14 sm:w-14";

  return (
    <>
      {/* Project thumbnails */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {images.map((src, index) => (
          <button key={`${src}-${index}`} type="button" onClick={() => setSelectedIndex(index)} className="group overflow-hidden rounded-xl border text-left" aria-label={`View image ${index + 1} of ${projectName}`}>
            <Image src={src} alt={`${projectName} screenshot ${index + 1}`} width={1200} height={800} className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-[100] overflow-hidden bg-black/60 backdrop-blur-xl" onClick={closeGallery}>
          {/* Close button */}
          <button type="button" onClick={closeGallery} className="absolute right-4 top-4 z-30 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/75 text-white shadow-lg transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:top-6 sm:h-14 sm:w-14" aria-label="Close gallery">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Image area */}
          <div className="absolute inset-x-0 bottom-16 top-16 flex items-center justify-center px-16 sm:px-24" onClick={(event) => event.stopPropagation()}>
            <div className="relative h-full w-full max-w-[1600px]">
              <Image key={images[currentIndex]} src={images[currentIndex]} alt={`${projectName} screenshot ${currentIndex + 1}`} fill priority sizes="100vw" className="object-contain" />
            </div>
          </div>

          {/* Previous button */}
          {images.length > 1 && (
            <button type="button" onClick={(event) => { event.stopPropagation(); showPrevious(); }} className={`${arrowButtonClass} left-5 sm:left-8`} aria-label="Previous image">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Next button */}
          {images.length > 1 && (
            <button type="button" onClick={(event) => { event.stopPropagation(); showNext(); }} className={`${arrowButtonClass} right-5 sm:right-8`} aria-label="Next image">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/20 bg-black/75 px-4 py-2 text-sm tabular-nums text-white">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
