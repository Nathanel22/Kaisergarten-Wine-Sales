import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { formatCHF } from '../utils/formatters';
import { X, Award, Utensils, Thermometer, Clock, Wine as WineIcon, Package, Plus, Check } from 'lucide-react';

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
              {wine.appellation || wine.region} • {wine.vintage}
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
          {/* Awards if present */}
          {wine.awards && wine.awards.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-gold-50/80 rounded-xl border border-gold-200">
              <Award className="w-5 h-5 text-gold-700 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-gold-900">
                  Prämierungen & Auszeichnungen
                </div>
                <div className="text-xs text-gold-950 font-medium space-x-2">
                  {wine.awards.map((a, i) => (
                    <span key={i} className="inline-block bg-white/90 px-2 py-0.5 rounded border border-gold-300/60 shadow-2xs">
                      ★ {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Charakteristik & Beschreibung
            </h4>
            <p className="text-stone-700 text-sm leading-relaxed">
              {wine.description}
            </p>
          </div>

          {/* Degustationsnotizen */}
          <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-wine-900 mb-3 flex items-center gap-2">
              <WineIcon className="w-4 h-4 text-wine-800" />
              Degustationsnotiz der Sommeliers
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3 rounded-xl border border-stone-200/70">
                <span className="font-bold text-stone-800 block mb-1">Farbe:</span>
                <span className="text-stone-600">{wine.tastingNotes.color}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200/70">
                <span className="font-bold text-stone-800 block mb-1">Nase (Bouquet):</span>
                <span className="text-stone-600">{wine.tastingNotes.nose}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200/70">
                <span className="font-bold text-stone-800 block mb-1">Gaumen:</span>
                <span className="text-stone-600">{wine.tastingNotes.palate}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200/70">
                <span className="font-bold text-stone-800 block mb-1">Abgang:</span>
                <span className="text-stone-600">{wine.tastingNotes.finish}</span>
              </div>
            </div>
          </div>

          {/* Speisebegleitung & Technische Daten */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Speisen */}
            <div className="bg-creme-50/70 p-4 rounded-2xl border border-creme-200">
              <h5 className="font-bold text-stone-800 mb-2 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-stone-600" />
                Speiseempfehlung
              </h5>
              <ul className="space-y-1.5 text-stone-600">
                {wine.foodPairing.map((food, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-600 shrink-0" />
                    <span>{food}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Servier- & Lagerdaten */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5">
              <div>
                <span className="text-stone-500 block text-[10px] uppercase font-bold">Rebsorte(n)</span>
                <span className="font-medium text-stone-800">{wine.grapeVariety}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold flex items-center gap-1">
                    <Thermometer className="w-3 h-3" /> Trinktemperatur
                  </span>
                  <span className="font-medium text-stone-800">{wine.servingTempC}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Reifepotenzial
                  </span>
                  <span className="font-medium text-stone-800">{wine.agingPotential}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-stone-200/80 pt-2 text-stone-600">
                <span>Flasche: {wine.bottleSizeCl} cl</span>
                <span>Alkohol: {wine.alcoholVol}% Vol.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Cart Additions) */}
        <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-wine-950">
                  {formatCHF(wine.priceCHF)}
                </span>
                <span className="text-xs text-stone-500">/ Einzelflasche</span>
              </div>
              {wine.casePriceCHF && (
                <div className="text-xs text-gold-900 font-medium">
                  {wine.caseSize}er Karton: <strong className="font-mono">{formatCHF(wine.casePriceCHF)}</strong>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addItem(wine, 1)}
                className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-white hover:bg-stone-100 text-stone-900 border border-stone-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+1 Flasche</span>
              </button>

              <button
                type="button"
                onClick={() => addCase(wine)}
                className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-wine-900 hover:bg-wine-950 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <Package className="w-4 h-4 text-gold-300" />
                <span>+6er Karton</span>
              </button>

              <button
                type="button"
                onClick={() => addDoubleCase(wine)}
                className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-gold-400/30 hover:bg-gold-400/40 border border-gold-500/50 text-gold-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
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
