import { useState } from 'react';
import { Wine } from '../types/wine';

export function ProductImage({ wine, className = '' }: { wine: Wine; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return wine.imageUrl && failedUrl !== wine.imageUrl ? (
    <img src={`${import.meta.env.BASE_URL}${wine.imageUrl}`} alt={wine.name}
      loading="lazy" decoding="async" onError={() => setFailedUrl(wine.imageUrl!)}
      className={`w-full h-full object-contain ${className}`} />
  ) : <div className="flex items-center justify-center h-full text-sm text-stone-500 text-center">Kein Produktbild verfügbar</div>;
}
