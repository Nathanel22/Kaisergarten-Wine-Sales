import React from 'react';
import { useCart } from '../context/CartContext';
import { formatDemoCHF } from '../utils/formatters';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const TabletQuickBar: React.FC = () => {
  const { summary, setIsCartOpen, isCartOpen } = useCart();

  if (summary.totalBottles === 0 || isCartOpen) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl transition-transform">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl bg-wine-900 text-gold-300 flex items-center justify-center shadow-md">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 bg-gold-400 text-stone-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
              {summary.totalBottles}
            </span>
          </div>

          <div>
            <div className="text-xs text-stone-500 font-medium">
              {summary.totalBottles} {summary.totalBottles === 1 ? 'Flasche' : 'Flaschen'} ausgewählt
            </div>
            <div className="text-base font-bold font-mono text-wine-950">
              {formatDemoCHF(summary.finalTotalCHF)}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="px-5 py-3 rounded-xl bg-wine-900 hover:bg-wine-950 active:scale-95 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all"
        >
          <span>Warenkorb prüfen</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
