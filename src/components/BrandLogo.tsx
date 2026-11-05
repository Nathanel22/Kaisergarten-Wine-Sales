import { useState } from 'react';

/** Local original artwork; use the name if the asset cannot be loaded. */
export function BrandLogo() {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span className="font-serif text-lg font-bold text-wine-950">Kaisergarten</span>
  ) : (
    <img
      src={`${import.meta.env.BASE_URL}images/kaisergarten-logo.png`}
      alt="Kaisergarten Weine"
      width={150}
      height={150}
      className="h-20 w-auto shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  );
}
