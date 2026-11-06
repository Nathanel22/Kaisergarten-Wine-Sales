import { ProductImage } from './ProductImage';
import { isOrderableWine } from '../utils/catalog';
import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { formatItemPrice } from '../utils/formatters';
import { X, Package, Plus, Check } from 'lucide-react';

export const WineDetailModal: React.FC = () => {
  const { selectedWineForModal, setSelectedWineForModal, addItem, addCase, addDoubleCase, items } = useCart();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedWineForModal(null);
      }
    };
    if (selectedWineForModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedWineForModal, setSelectedWineForModal]);

  if (!selectedWineForModal) return null;

  const wine = selectedWineForModal;
  const orderable = isOrderableWine(wine);
  const inCart = items.find((i) => i.wine.id === wine.id);
  const cartQty = inCart?.quantity || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      {/* Click outside backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={() => setSelectedWineForModal(null)} 
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Header with bordeaux bar */}
        <div className="relative bg-gradient-to-r from-wine-950 via-wine-900 to-stone-900 text-white p-6 sm:p-7 shrink-0">
          <button
            onClick={() => setSelectedWineForModal(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-none"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-widest font-mono text-gold-300 bg-gold-500/20 px-2.5 py-0.5 rounded-full border border-gold-400/30">
              {[wine.sourceCategory, wine.country, wine.vintage].filter(Boolean).join(' · ')}
            </span>
            {wine.badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gold-400 text-stone-950">
                {wine.badge}
              </span>
            )}
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            {wine.name}
          </h2>
          <p className="text-sm text-stone-300 font-medium">
            {wine.subTitle || wine.grapeVariety}
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6">
          <div className="h-64 rounded-xl bg-stone-50 p-3"><ProductImage wine={wine} /></div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Charakteristik & Beschreibung</h4>
            <p className="text-stone-700 text-sm leading-relaxed">{wine.description || 'Beschreibung noch nicht vorhanden.'}</p>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-stone-50 rounded-2xl p-5 border border-stone-200">
            {[
              ['Artikel-ID', wine.sourceId], ['Kategorie', wine.sourceCategory],
              ['Jahrgang', wine.vintage], ['Rebsorte(n)', wine.grapeVariety],
              ['Herkunftsland', wine.country], ['Region', wine.region], ['Geschmack', wine.flavor],
              ['Flaschengrösse', wine.bottleSizeCl != null ? `${wine.bottleSizeCl} cl` : null],
              ['Alkohol', wine.alcoholVol != null ? `${wine.alcoholVol}% Vol.` : wine.alcoholNote],
              ['Restzucker', wine.residualSugarGL != null ? `${wine.residualSugarGL} g/l` : null],
              ['Säure', wine.acidityGL != null ? `${wine.acidityGL} g/l` : null],
              ['Gebinde', wine.packagingNote || null],
            ].map(([label, value]) => <div key={String(label)}><dt className="text-xs font-bold text-stone-500">{label}</dt><dd className="text-stone-800 mt-1">{(value ?? '') || 'Nicht angegeben / ungeklärt'}</dd></div>)}
          </dl>
          {!!wine.dataIssues?.length && <div className="text-xs text-stone-600 bg-gold-50 border border-gold-200 rounded-xl p-4"><strong>Hinweise zu den Quelldaten</strong><ul className="list-disc pl-4 mt-2 space-y-1">{wine.dataIssues.map(issue => <li key={issue}>{issue}</li>)}</ul></div>}
          {wine.sourceUrl && <a className="text-sm text-wine-800 underline" href={wine.sourceUrl} target="_blank" rel="noreferrer">Originalprodukt bei Kaisergarten ansehen</a>}

        </div>

        {/* Footer Actions (Cart Additions) */}
        <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 shrink-0">
          {orderable && <p className="text-xs text-stone-600 mb-3">Simuliertes Kartongebinde. Lieferbedingungen sind unbestätigt.</p>}
          {!orderable && <p className="text-xs text-stone-600 mb-3">Nur zur Ansicht. Für die Kartonsimulation nicht freigegeben.</p>}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-wine-950">
                  {wine.priceCHF != null ? formatItemPrice(wine.priceCHF, wine.priceSource) : 'Preis noch nicht hinterlegt'}
                </span>
                {wine.priceCHF != null && <span className="text-xs text-stone-500">/ Einzelflasche</span>}
              </div>
              {wine.casePriceCHF && (
                <div className="text-xs text-gold-900 font-medium">
                  {wine.caseSize}er Karton: <strong className="font-mono">{formatItemPrice(wine.casePriceCHF, wine.priceSource)}</strong>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!orderable}
                onClick={() => addItem(wine, 1)}
                className="disabled:opacity-40 disabled:cursor-not-allowed flex-1 sm:flex-none px-4 py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+1 Flasche</span>
              </button>

              <button
                type="button"
                disabled={!orderable}
                onClick={() => addCase(wine)}
                className="disabled:opacity-40 disabled:cursor-not-allowed flex-1 sm:flex-none px-4 py-3 rounded-xl bg-wine-900 hover:bg-wine-950 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <Package className="w-4 h-4 text-gold-300" />
                <span>+6er Karton</span>
              </button>

              <button
                type="button"
                disabled={!orderable}
                onClick={() => addDoubleCase(wine)}
                className="disabled:opacity-40 disabled:cursor-not-allowed flex-1 sm:flex-none px-4 py-3 rounded-xl bg-gold-400/30 hover:bg-gold-400/40 border border-gold-500/50 text-gold-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <Package className="w-4 h-4 text-gold-800" />
                <span>+12er (2 Kartons)</span>
              </button>
            </div>
          </div>

          {cartQty > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-200/80 text-center text-xs text-emerald-800 font-medium flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Aktuell <strong>{cartQty} Flaschen</strong> im Warenkorb</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
