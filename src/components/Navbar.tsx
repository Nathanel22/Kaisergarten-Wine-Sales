import React, { useState } from 'react';
import { ShoppingBag, History, UserCheck, ChevronDown } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useCart } from '../context/CartContext';
import { formatCHF } from '../utils/formatters';
import { DEMO_TABLET_ID, getDemoFairContext } from '../config/fairContext';
import { DEMO_SELLERS } from '../config/demoSeller';

export const Navbar: React.FC = () => {
  const { summary, setIsCartOpen, activeSeller, setActiveSeller, setIsOrderHistoryOpen } = useCart();
  const fairContext = getDemoFairContext();
  const [isSellerMenuOpen, setIsSellerMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
      {/* Top Banner: Messe Context & Tablet Info */}
      <div className="bg-wine-950 text-gold-200 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-gold-900/40">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <span
            aria-hidden="true"
            className={`inline-block w-2 h-2 rounded-full ${
              fairContext ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span>{fairContext?.fairName ?? 'Keine aktive Messe zugewiesen'}</span>
          <span className="text-stone-400">|</span>
          <span className="text-stone-300">{fairContext?.booth ?? 'Kein Stand zugewiesen'}</span>
        </div>

        {/* Verkäufer-Umschalter & Tablet-Status */}
        <div className="flex items-center gap-3 text-stone-300">
          <span className="bg-wine-900/80 px-2 py-0.5 rounded text-[11px] font-mono border border-gold-800/40">
            {DEMO_TABLET_ID}
          </span>

          {/* Touch-fähige Verkäufer-Schnellauswahl */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSellerMenuOpen(!isSellerMenuOpen)}
              className="flex items-center gap-1.5 bg-wine-900/90 hover:bg-wine-900 text-white px-2.5 py-0.5 rounded-lg border border-gold-700/50 text-[11px] font-medium transition-colors"
              title="Verkäufer wechseln"
            >
              <UserCheck className="w-3.5 h-3.5 text-gold-300" />
              <span>Verkäufer: <strong className="text-gold-200">{activeSeller.name}</strong></span>
              <ChevronDown className="w-3 h-3 text-stone-300" />
            </button>

            {isSellerMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSellerMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-stone-200 py-1 z-50 text-stone-800 animate-fade-in text-xs">
                  <div className="px-3 py-1.5 border-b border-stone-100 font-bold text-[10px] text-stone-400 uppercase">
                    Verkäufer auswählen
                  </div>
                  {DEMO_SELLERS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setActiveSeller(s);
                        setIsSellerMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-stone-50 transition-colors ${
                        activeSeller.id === s.id ? 'bg-wine-50 text-wine-900 font-bold' : ''
                      }`}
                    >
                      <div>
                        <div>{s.name}</div>
                        <div className="text-[10px] text-stone-500">{s.role}</div>
                      </div>
                      {activeSeller.id === s.id && (
                        <span className="text-emerald-700 font-bold">✓</span>
                      )}
                    </button>
                  ))}
                  <div className="px-3 py-1.5 border-t border-stone-100 text-[10px] text-stone-400">
                    Ändert Messezuordnung nicht
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-24 py-2 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <BrandLogo />
          <div className="hidden sm:block border-l border-gold-200 pl-4">
            <p className="font-serif text-xl text-wine-950">Kaisergarten Weine</p>
            <p className="mt-1 text-xs text-stone-500 tracking-wider uppercase">Messeverkauf · Wine Sales</p>
          </div>
        </div>

        {/* Right actions: Bestellhistorie & Warenkorb */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Button Bestellhistorie */}
          <button
            onClick={() => setIsOrderHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 hover:border-stone-400 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all shadow-2xs"
            title="Bestellhistorie des Tablets anzeigen"
          >
            <History className="w-4 h-4 text-wine-900" />
            <span className="hidden sm:inline">Bestellungen</span>
          </button>

          {/* Cart Button optimized for Tablet */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="group relative flex items-center gap-3 px-4 py-2.5 rounded-xl bg-wine-900 hover:bg-wine-950 active:scale-95 transition-all duration-200 text-white shadow-md border border-wine-800 focus:outline-none focus:ring-2 focus:ring-gold-400"
            aria-label="Warenkorb öffnen"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-gold-300 group-hover:scale-110 transition-transform" />
              {summary.totalBottles > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold-500 text-stone-950 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-scale-in">
                  {summary.totalBottles}
                </span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[10px] uppercase text-stone-300 tracking-wider font-semibold">
                Warenkorb
              </div>
              <div className="text-sm font-bold text-gold-200 font-mono leading-none">
                {formatCHF(summary.finalTotalCHF)}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
