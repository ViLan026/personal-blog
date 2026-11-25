"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Shows /public/me.png. The owner adds that file later, so until it exists
 * (or if it ever fails to load) a plain block with the initials is shown
 * instead of a broken-image icon.
 */
export function ProfilePhoto({
  src,
  alt,
  initials,
}: {
  src: string;
  alt: string;
  initials: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-xs pb-3 pr-3 md:max-w-sm">
      {/* Offset outline frame: a border only, no shadow and no extra colour. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
      />
      <div className="relative aspect-[4/5] w-full overflow-hidden border-2 border-primary bg-background">
        {failed ? (
          <div
            role="img"
            aria-label={alt}
            className="flex h-full w-full items-center justify-center bg-primary text-6xl font-extrabold tracking-widest text-background"
          >
            {initials}
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            priority
            sizes="(min-width: 768px) 24rem, 20rem"
            className="object-cover"
            onError={() => setFailed(true)}
            // The image can fail before React attaches onError during hydration.
            ref={(img) => {
              if (img && img.complete && img.naturalWidth === 0) setFailed(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
