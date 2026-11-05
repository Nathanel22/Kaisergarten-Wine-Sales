import React from 'react';
import { Wine, Package, ShoppingBag } from 'lucide-react';

export const HeroBanner: React.FC = () => (
  <section aria-labelledby="collection-title" className="relative overflow-hidden rounded-2xl bg-white border border-creme-200 border-l-4 border-l-wine-800 my-6">
    <div aria-hidden="true" className="absolute -top-24 -right-24 w-80 h-80 bg-gold-100/50 rounded-full pointer-events-none" />
    <div className="relative p-6 sm:p-8 md:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700 mb-3">Persönlich ausgewählt. Mit Freude entdeckt.</p>
      <h1 id="collection-title" className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-wine-950 mb-3">Kaisergarten Weinkollektion</h1>
      <p className="font-serif text-xl sm:text-2xl text-wine-800 mb-3">Das Auge besticht, Ihr Gaumen nicht!</p>
      <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mb-6">
        Vom Feinsten das Beste, vom Kenner für den wahren Geniesser persönlich ausgewählt – das ist unsere Philosophie.
      </p>
      <div className="flex flex-wrap gap-3 border-t border-creme-200 pt-5 text-xs text-wine-900">
        <span className="inline-flex items-center gap-2 rounded-full bg-wine-50 px-3 py-2"><Wine className="h-4 w-4" aria-hidden="true" />Weine entdecken</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-gold-50 px-3 py-2"><Package className="h-4 w-4" aria-hidden="true" />Flaschen & Kartons wählen</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-creme-100 px-3 py-2"><ShoppingBag className="h-4 w-4" aria-hidden="true" />Warenkorb zusammenstellen</span>
      </div>
      <p className="mt-4 text-xs text-stone-500">Offizielles Sortiment · Stand 06.11.2026 · Präsentationsdemo ohne echte Bestellungen.</p>
    </div>
  </section>
);
