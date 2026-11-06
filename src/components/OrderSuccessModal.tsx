import React from 'react';
import { useCart } from '../context/CartContext';
import { formatDemoCHF } from '../utils/formatters';
import { CheckCircle2, PackageCheck, ShoppingBag, History, X } from 'lucide-react';

export const OrderSuccessModal: React.FC = () => {
  const { completedOrder, setCompletedOrder, setIsOrderHistoryOpen } = useCart();

  if (!completedOrder) return null;

  const order = completedOrder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-stone-950/75 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={() => setCompletedOrder(null)} />

      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 max-h-[92vh] flex flex-col">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-emerald-800 to-wine-950 text-white p-6 text-center shrink-0 relative">
          <button
            onClick={() => setCompletedOrder(null)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Schliessen"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 mx-auto mb-3 shadow-lg">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-300 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-500/40">
            Erfolgreich abgeschlossen
          </span>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-2 text-white">
            Demo-Bestellung simuliert!
          </h2>
          <p className="text-xs text-stone-200 mt-1">
            Nur lokal gespeichert. Keine echte Bestellung, Zahlung oder Lieferung.
          </p>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Order ID & Fair Banner */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Bestellnummer</span>
              <strong className="text-base font-mono text-wine-950">{order.id}</strong>
              <div className="text-[11px] text-stone-500">{order.formattedDate}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Messe & Stand</span>
              <div className="font-bold text-stone-800">{order.fairName}</div>
              <div className="text-stone-500 font-mono text-[11px]">{order.booth} · {order.tabletId}</div>
            </div>
          </div>

          {/* Customer & Seller */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/80">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                Kunde
              </span>
              <p className="font-serif font-bold text-stone-900">
                {order.customer.salutation} {order.customer.firstName} {order.customer.lastName}
              </p>
              {order.customer.company && (
                <p className="text-stone-600 text-[11px]">{order.customer.company}</p>
              )}
              <p className="text-stone-600 mt-0.5">
                {order.customer.street}, {order.customer.zip} {order.customer.city}
              </p>
              <p className="text-stone-500 font-mono text-[11px] mt-1">{order.customer.phone}</p>
            </div>

            <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/80">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                Zuständiger Verkäufer
              </span>
              <p className="font-serif font-bold text-stone-900">{order.sellerName}</p>
              <p className="text-stone-600">{order.sellerRole || 'Sommelier'}</p>
              <p className="text-stone-400 font-mono text-[11px] mt-1">ID: {order.sellerId}</p>
            </div>
          </div>

          {/* Ordered Items */}
          <div className="border border-stone-200 rounded-2xl overflow-hidden">
            <div className="bg-stone-100 px-3.5 py-2 font-bold text-stone-800 flex justify-between">
              <span>{order.totalBottles} Flaschen ({order.completeCases} Kartons)</span>
              <span>Betrag</span>
            </div>
            <div className="divide-y divide-stone-100 max-h-40 overflow-y-auto">
              {order.items.map((i) => (
                <div key={i.wineId} className="px-3.5 py-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-stone-900">{i.name}</span>
                    <span className="text-stone-500 font-mono ml-2">
                      {i.quantity} × {formatDemoCHF(i.unitPriceCHF)}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-stone-900">
                    {formatDemoCHF(i.lineTotalCHF)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Block */}
            <div className="bg-stone-50 p-3.5 border-t border-stone-200 space-y-1">
              {order.pricing.cartonDiscountCHF > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Messevorteil & Kartonrabatt:</span>
                  <span className="font-mono">-{formatDemoCHF(order.pricing.cartonDiscountCHF)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-500 text-[11px]">
                <span>Enthaltene MwSt. (8.1% CH):</span>
                <span className="font-mono">{formatDemoCHF(order.pricing.mwstCHF)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 text-base font-bold text-stone-950">
                <span className="font-serif">Gesamtbetrag (CHF):</span>
                <span className="font-mono text-xl text-wine-950">
                  {formatDemoCHF(order.pricing.finalTotalCHF)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Note */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>
              <strong>Simulation:</strong> Die Demo-Kartons wurden lokal erfasst.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCompletedOrder(null);
              setIsOrderHistoryOpen(true);
            }}
            className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs flex items-center gap-2 transition-all"
          >
            <History className="w-4 h-4 text-stone-500" />
            <span>Bestellübersicht öffnen</span>
          </button>

          <button
            type="button"
            onClick={() => setCompletedOrder(null)}
            className="py-2.5 px-6 rounded-xl bg-wine-900 hover:bg-wine-950 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-gold-300" />
            <span>Neue Bestellung starten</span>
          </button>
        </div>
      </div>
    </div>
  );
};
