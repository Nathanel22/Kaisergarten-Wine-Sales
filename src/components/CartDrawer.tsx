import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { formatSimulationTotal, formatItemPrice, formatBottlesSummary } from '../utils/formatters';
import { X, Trash2, Plus, Minus, Package, ShoppingBag, Truck, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { DEMO_TABLET_ID, getDemoFairContext } from '../config/fairContext';

export const CartDrawer: React.FC = () => {
  const fairContext = getDemoFairContext();
  const {
    isCartOpen,
    setIsCartOpen,
    items,
    addItem,
    addCase,
    addDoubleCase,
    removeBottles,
    removeItem,
    clearCart,
    summary,
    cartonValidation,
    setIsCheckoutOpen,
    activeSeller,
  } = useCart();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
          {/* Header */}
          <div className="p-5 bg-wine-950 text-white flex items-center justify-between border-b border-wine-900">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-wine-900 flex items-center justify-center text-gold-300">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold">Warenkorb</h3>
                <p className="text-xs text-gold-200">
                  {formatBottlesSummary(summary.totalBottles)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-none"
              aria-label="Warenkorb schliessen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Fair Info Bar */}
          <div className="bg-stone-100 px-5 py-2 border-b border-stone-200 text-xs text-stone-600 flex flex-wrap items-center justify-between gap-2">
            <span>Stand: <strong>{fairContext?.booth ?? 'Nicht zugewiesen'}</strong></span>
            <span>Messe: <strong>{fairContext?.fairName ?? 'Keine aktive Messe zugewiesen'}</strong></span>
            <span>Tablet: <strong>{DEMO_TABLET_ID}</strong></span>
          </div>

          {/* Verbindliche Kartonregel Statusleiste */}
          {items.length > 0 && (
            <div
              className={`px-5 py-3 border-b text-xs flex items-start gap-2.5 transition-colors ${
                cartonValidation.isValid
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/90 border-amber-200 text-amber-900'
              }`}
            >
              {cartonValidation.isValid ? (
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold flex items-center justify-between">
                  <span>{cartonValidation.statusMessage}</span>
                  {cartonValidation.isValid && (
                    <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-mono px-1.5 py-0.5 rounded">
                      Gültig
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-0.5 leading-tight opacity-90">
                  {cartonValidation.detailedExplanation}
                </p>
              </div>
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h4 className="font-serif font-bold text-lg text-stone-800 mb-1">
                  Der Warenkorb ist leer
                </h4>
                <p className="text-xs text-stone-500 max-w-xs mb-6">
                  Wählen Sie aus unserem Weinsortiment Flaschen oder Kartons aus. In der Simulation lassen sich je sechs Flaschen frei mischen.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-wine-900 hover:bg-wine-950 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Zum Weinkatalog
                </button>
              </div>
            ) : (
              items.map((item) => {
                const singlePrice = item.wine.priceCHF;
                const lineTotal = singlePrice * item.quantity;

                return (
                  <div
                    key={item.wine.id}
                    className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-200/90 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-serif font-bold text-sm text-stone-900 leading-tight">
                            {item.wine.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {item.wine.vintage} • {item.wine.grapeVariety}
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.wine.id)}
                        className="text-stone-400 hover:text-red-700 p-1 transition-colors"
                        title="Position entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stepper and Price */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Tablet Touch Stepper */}
                      <div className="flex items-center gap-1 bg-white border border-stone-300 rounded-xl p-0.5 shadow-2xs">
                        <button
                          onClick={() => removeBottles(item.wine.id, 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100 active:scale-95 transition-all"
                          aria-label="Eine Flasche weniger"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-xs text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addItem(item.wine, 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-wine-900 hover:bg-wine-950 active:scale-95 transition-all"
                          aria-label="Eine Flasche mehr"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>

                        {/* Schnellauswahl +6 und +12 */}
                        <button
                          onClick={() => addCase(item.wine)}
                          className="px-2 h-8 rounded-lg text-[10px] font-bold text-gold-900 bg-gold-100 hover:bg-gold-200 flex items-center gap-0.5 transition-colors ml-1"
                          title="Plus 1 voller Karton (6 Flaschen)"
                        >
                          <Package className="w-3 h-3 text-gold-800" />
                          <span>+6</span>
                        </button>
                        <button
                          onClick={() => addDoubleCase(item.wine)}
                          className="px-2 h-8 rounded-lg text-[10px] font-bold text-gold-950 bg-gold-200 hover:bg-gold-300 flex items-center gap-0.5 transition-colors"
                          title="Plus 2 volle Kartons (12 Flaschen)"
                        >
                          <Package className="w-3 h-3 text-gold-800" />
                          <span>+12</span>
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-stone-900">
                          {formatItemPrice(lineTotal, item.wine.priceSource)}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {formatItemPrice(singlePrice, item.wine.priceSource)} / Fl.
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Calculations and POS Checkout Trigger */}
          {items.length > 0 && (
            <div className="p-5 bg-stone-50 border-t border-stone-200 space-y-3">
              {/* Delivery advantage banner */}
              {summary.totalBottles >= 12 ? (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span><strong>Gratis Messeversand</strong> aktiviert (ab 12 Flaschen)!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-stone-100 text-stone-600 text-xs">
                  <Truck className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>Noch <strong>{12 - summary.totalBottles} Flaschen</strong> bis zum kostenlosen Messeversand</span>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600 pt-1">
                <div className="flex justify-between">
                  <span>Zwischensumme ({summary.totalBottles} Flaschen):</span>
                  <span className="font-mono text-stone-800">{formatSimulationTotal(summary.rawSubtotalCHF)}</span>
                </div>

                {summary.cartonDiscountCHF > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Messe- & Kartonvorteil (unbestätigte Annahme):</span>
                    <span className="font-mono">-{formatSimulationTotal(summary.cartonDiscountCHF)}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>Darin enthaltene MwSt. (8.1% CH):</span>
                  <span className="font-mono">{formatSimulationTotal(summary.mwstCHF)}</span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 text-base font-bold text-stone-950">
                  <span className="font-serif">Gesamtbetrag (CHF):</span>
                  <span className="font-mono text-xl text-wine-950">
                    {formatSimulationTotal(summary.finalTotalCHF)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                {cartonValidation.canCheckout ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-wine-900 hover:bg-wine-950 text-white font-bold text-sm shadow-lg shadow-wine-950/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <span>Bestellsimulation starten</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="space-y-1">
                    <button
                      type="button"
                      disabled
                      className="w-full py-3.5 px-4 rounded-xl bg-stone-300 text-stone-500 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span>Kartonregel nicht erfüllt</span>
                    </button>
                    <p className="text-[11px] text-center text-amber-800 font-medium">
                      Noch {cartonValidation.missingBottlesToNextCase} Flasche(n) bis zum 6er-Karton nötig
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={clearCart}
                    className="text-xs text-stone-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Warenkorb leeren</span>
                  </button>

                  <span className="text-[11px] text-stone-400 font-mono">
                    Verkäufer: {activeSeller.name}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
