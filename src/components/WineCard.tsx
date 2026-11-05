import React from 'react';
import { Wine } from '../types/wine';
import { useCart } from '../context/CartContext';
import { formatCHF } from '../utils/formatters';
import { Info, Plus, Minus, Package, Award } from 'lucide-react';

interface WineCardProps {
  wine: Wine;
}

export const WineCard: React.FC<WineCardProps> = ({ wine }) => {
  const { items, addItem, addCase, addDoubleCase, removeBottles, setSelectedWineForModal } = useCart();

  const cartItem = items.find((i) => i.wine.id === wine.id);
  const currentQuantity = cartItem?.quantity || 0;

  // Category theme accents for bottle preview
  const getCategoryStyles = () => {
    switch (wine.category) {
      case 'red':
        return {
          bottleBg: 'from-red-950 via-red-900 to-stone-900',
          accent: 'text-red-800 bg-red-50 border-red-200',
          indicator: 'bg-red-700',
          badgeText: 'Rotwein',
        };
      case 'white':
        return {
          bottleBg: 'from-amber-100 via-amber-200/80 to-yellow-100',
          accent: 'text-amber-800 bg-amber-50 border-amber-200',
          indicator: 'bg-amber-400',
          badgeText: 'Weisswein',
        };
      case 'rose':
        return {
          bottleBg: 'from-rose-100 via-rose-200 to-pink-100',
          accent: 'text-rose-800 bg-rose-50 border-rose-200',
          indicator: 'bg-rose-400',
          badgeText: 'Rosé',
        };
      case 'sparkling':
        return {
          bottleBg: 'from-gold-100 via-gold-200 to-amber-200',
          accent: 'text-gold-900 bg-gold-50 border-gold-300',
          indicator: 'bg-gold-500',
          badgeText: 'Schaumwein',
        };
      case 'special':
        return {
          bottleBg: 'from-amber-200 via-yellow-300 to-amber-400',
          accent: 'text-amber-950 bg-amber-100 border-amber-300',
          indicator: 'bg-amber-600',
          badgeText: 'Edelsüss',
        };
    }
  };

  const style = getCategoryStyles();
  const caseSavings = wine.casePriceCHF
    ? wine.priceCHF * wine.caseSize - wine.casePriceCHF
    : 0;

  return (
    <div className={`flex flex-col justify-between bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md ${
      currentQuantity > 0 ? 'border-wine-500 ring-2 ring-wine-500/20' : 'border-stone-200/90 hover:border-stone-300'
    }`}>
      {/* Top section: Bottle representation & Badges */}
      <div className="relative p-5 pb-3">
        {/* Badges bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${style.accent}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.indicator}`} />
            {style.badgeText} • {wine.vintage}
          </span>
          {wine.badge && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-800 border border-gold-300">
              <Award className="w-3 h-3 text-gold-700" />
              {wine.badge}
            </span>
          )}
        </div>

        {/* Visual Bottle Representation */}
        <div 
          onClick={() => setSelectedWineForModal(wine)}
          className="group cursor-pointer relative h-36 rounded-xl bg-gradient-to-b from-stone-50 to-stone-100/60 border border-stone-100 flex items-center justify-center p-3 mb-4 overflow-hidden"
          title="Klicken für Degustationsnotizen"
        >
          {/* Stylized bottle silhouette */}
          <div className="relative flex flex-col items-center group-hover:scale-105 transition-transform duration-300">
            {/* Bottle neck */}
            <div className={`w-3.5 h-8 rounded-t-sm bg-gradient-to-r ${style.bottleBg} shadow-sm border-t border-gold-400/50`} />
            {/* Bottle body */}
            <div className={`w-12 h-20 rounded-t-lg rounded-b-md bg-gradient-to-r ${style.bottleBg} shadow-md flex items-center justify-center relative p-1`}>
              {/* Label */}
              <div className="w-9 h-11 bg-creme-50/95 rounded-sm p-0.5 text-center flex flex-col items-center justify-center shadow-inner">
                <span className="text-[6px] tracking-widest text-stone-700 font-serif uppercase">KG</span>
                <span className="text-[5px] text-wine-900 font-bold truncate max-w-full">{wine.vintage}</span>
              </div>
            </div>
          </div>

          <button 
            type="button"
            className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-xs font-medium text-stone-600 bg-white/90 hover:bg-white shadow-sm px-2.5 py-1 rounded-lg border border-stone-200 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-wine-800" />
            <span>Details</span>
          </button>
        </div>

        {/* Wine Details & Specs */}
        <div>
          <h3 
            onClick={() => setSelectedWineForModal(wine)}
            className="font-serif font-bold text-lg text-stone-900 hover:text-wine-800 cursor-pointer transition-colors leading-snug line-clamp-1"
          >
            {wine.name}
          </h3>
          <p className="text-xs text-stone-500 font-medium line-clamp-1 mb-2">
            {wine.subTitle || wine.grapeVariety}
          </p>

          <div className="flex items-center gap-2 text-xs text-stone-600 mb-3 font-mono">
            <span>{wine.region}</span>
            <span>•</span>
            <span>{wine.bottleSizeCl} cl</span>
            <span>•</span>
            <span>{wine.alcoholVol}% Vol.</span>
          </div>

          <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed h-8">
            {wine.description}
          </p>
        </div>
      </div>

      {/* Pricing and Cart Stepper (Tablet POS optimized) */}
      <div className="p-4 pt-3 bg-stone-50/70 border-t border-stone-100 rounded-b-2xl">
        {/* Price row */}
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase font-semibold text-stone-500">
              Einzelflasche
            </div>
            <div className="text-xl font-bold font-mono text-stone-900">
              {formatCHF(wine.priceCHF)}
            </div>
          </div>
          {wine.casePriceCHF && (
            <div className="text-right">
              <div className="text-[10px] uppercase font-semibold text-gold-800">
                {wine.caseSize}er Karton {caseSavings > 0 && <span className="text-emerald-700 font-bold">(-{formatCHF(caseSavings)})</span>}
              </div>
              <div className="text-sm font-bold font-mono text-stone-700">
                {formatCHF(wine.casePriceCHF)}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons (Large touch targets for tablet) */}
        <div className="space-y-2">
          {/* Stepper row */}
          <div className="flex items-center gap-1.5">
            {currentQuantity > 0 ? (
              <div className="flex-1 flex items-center justify-between bg-white border border-wine-300 rounded-xl p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => removeBottles(wine.id, 1)}
                  className="w-9 h-10 rounded-lg flex items-center justify-center text-stone-600 hover:text-wine-900 hover:bg-stone-100 active:scale-95 transition-all"
                  aria-label="Eine Flasche abziehen"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                </button>
                <div className="text-center font-mono font-bold text-xs sm:text-sm text-wine-950 px-1">
                  {currentQuantity} Fl.
                </div>
                <button
                  type="button"
                  onClick={() => addItem(wine, 1)}
                  className="w-9 h-10 rounded-lg flex items-center justify-center text-white bg-wine-900 hover:bg-wine-950 active:scale-95 transition-all shadow-sm"
                  aria-label="Eine Flasche hinzufügen"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => addItem(wine, 1)}
                className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-xl bg-white border border-stone-300 hover:border-wine-800 hover:text-wine-900 text-stone-800 text-xs sm:text-sm font-semibold active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+1 Fl.</span>
              </button>
            )}

            {/* Quick 6-pack button */}
            <button
              type="button"
              onClick={() => addCase(wine)}
              className="h-11 px-2.5 sm:px-3 rounded-xl bg-gold-400/20 hover:bg-gold-400/30 border border-gold-400/50 text-gold-950 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shrink-0"
              title={`Sofort 1 Karton (${wine.caseSize} Flaschen) hinzufügen`}
            >
              <Package className="w-3.5 h-3.5 text-gold-800" />
              <span>+{wine.caseSize}</span>
            </button>

            {/* Quick 12-pack button */}
            <button
              type="button"
              onClick={() => addDoubleCase(wine)}
              className="h-11 px-2.5 sm:px-3 rounded-xl bg-gold-400/30 hover:bg-gold-400/40 border border-gold-500/50 text-gold-950 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shrink-0"
              title="Sofort 2 Kartons (12 Flaschen) hinzufügen"
            >
              <Package className="w-3.5 h-3.5 text-gold-800" />
              <span>+12</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
