import { useState, useEffect } from 'react';

/**
 * SafeImage — renders an <img> with automatic fallback when the image fails to load.
 * Pass `fallback` to override the default hidden state.
 */
export default function SafeImage({ src, alt, className, fallback, ...props }) {
  const [broken, setBroken] = useState(false);

  // Reset broken state whenever src changes so a new URL gets a fresh load attempt
  useEffect(() => {
    setBroken(false);
  }, [src]);

  if (broken || !src) {
    if (fallback) return fallback;
    return null;
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      onError={() => setBroken(true)}
      {...props}
    />
  );
}