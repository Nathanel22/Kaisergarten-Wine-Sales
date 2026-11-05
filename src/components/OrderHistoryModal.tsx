import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Order } from '../types/order';
import { loadStoredOrders } from '../utils/orderProcessing';
import { formatCHF } from '../utils/formatters';
import { X, Search, FileText, ShieldAlert } from 'lucide-react';

export const OrderHistoryModal: React.FC = () => {
  const { isOrderHistoryOpen, setIsOrderHistoryOpen } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (isOrderHistoryOpen) {
      setOrders(loadStoredOrders());
    }
  }, [isOrderHistoryOpen]);

  if (!isOrderHistoryOpen) return null;

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customer.lastName.toLowerCase().includes(q) ||
      o.customer.firstName.toLowerCase().includes(q) ||
      o.sellerName.toLowerCase().includes(q) ||
      o.formattedDate.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={() => setIsOrderHistoryOpen(false)} />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-wine-950 text-white p-5 sm:p-6 border-b border-wine-900 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold-300">
              Tablet POS · Erfasste Bestellungen
            </span>
            <h2 className="font-serif text-2xl font-bold text-white">Demo-Bestellübersicht</h2>
          </div>
          <button
            onClick={() => setIsOrderHistoryOpen(false)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Schliessen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LocalStorage Demo Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Lokaler Demo-Speicher:</strong> Bestellungen sind lokal im Browser dieses Geräts gespeichert. 
            Eine geräteübergreifende Synchronisation erfolgt in dieser Phase noch nicht.
          </span>
        </div>

        {/* Content Area: Split View oder Detailansicht */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
          {/* Linke Spalte: Bestellungsliste */}
          <div className="w-full md:w-1/2 flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Bestell-Nr., Kunde oder Sommelier suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-800"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh] md:max-h-none">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                  <FileText className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="font-semibold text-stone-700">Noch keine Bestellungen</p>
                  <p className="mt-1">
                    Schliessen Sie über den Warenkorb eine Bestellung ab, um sie hier zu sehen.
                  </p>
                </div>
              ) : (
                filteredOrders.map((ord) => {
                  const isSelected = selectedOrder?.id === ord.id;
                  return (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-wine-50 border-wine-600 ring-2 ring-wine-600/20'
                          : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-stone-900">{ord.id}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                            Abgeschlossen
                          </span>
                        </div>
                        <p className="font-serif font-bold text-xs text-stone-800 mt-1 truncate">
                          {ord.customer.firstName} {ord.customer.lastName}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {ord.totalBottles} Flaschen ({ord.completeCases} Kartons) · {ord.formattedDate}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-sm text-wine-950">
                          {formatCHF(ord.pricing.finalTotalCHF)}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">{ord.sellerName}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Rechte Spalte: Detailanzeige der ausgewählten Bestellung */}
          <div className="w-full md:w-1/2 flex flex-col bg-stone-50/70 rounded-2xl border border-stone-200 p-4 overflow-y-auto">
            {selectedOrder ? (
              <div className="space-y-4 text-xs">
                <div className="border-b border-stone-200 pb-3 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Bestelldetails</span>
                    <strong className="text-base font-mono text-wine-950">{selectedOrder.id}</strong>
                    <div className="text-stone-500">{selectedOrder.formattedDate}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Messe</span>
                    <strong className="text-stone-800">{selectedOrder.fairName}</strong>
                    <div className="text-stone-500 font-mono text-[11px]">{selectedOrder.booth} · {selectedOrder.tabletId}</div>
                  </div>
                </div>

                {/* Kunde & Verkäufer */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Kunde</span>
                    <strong className="text-stone-900 block font-serif">
                      {selectedOrder.customer.salutation} {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                    </strong>
                    <p className="text-stone-600 text-[11px]">{selectedOrder.customer.street}</p>
                    <p className="text-stone-600 text-[11px]">{selectedOrder.customer.zip} {selectedOrder.customer.city}</p>
                    <p className="text-stone-500 font-mono text-[10px] mt-1">{selectedOrder.customer.email}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Verkäufer</span>
                    <strong className="text-stone-900 block font-serif">{selectedOrder.sellerName}</strong>
                    <p className="text-stone-600 text-[11px]">{selectedOrder.sellerRole || 'Sommelier'}</p>
                    <p className="text-stone-400 font-mono text-[10px] mt-1">ID: {selectedOrder.sellerId}</p>
                  </div>
                </div>

                {/* Historische Artikel */}
                <div className="border border-stone-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-stone-100 px-3 py-1.5 font-bold text-stone-800 flex justify-between text-[11px]">
                    <span>Artikel ({selectedOrder.totalBottles} Flaschen)</span>
                    <span>Betrag</span>
                  </div>
                  <div className="divide-y divide-stone-100 max-h-36 overflow-y-auto">
                    {selectedOrder.items.map((i) => (
                      <div key={i.wineId} className="px-3 py-1.5 flex justify-between text-[11px]">
                        <div>
                          <span className="font-semibold text-stone-900">{i.name}</span>
                          <span className="text-stone-500 font-mono ml-1.5">
                            {i.quantity} × {formatCHF(i.unitPriceCHF)}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-stone-900">
                          {formatCHF(i.lineTotalCHF)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-stone-50 p-2.5 border-t border-stone-200 text-[11px] space-y-1">
                    <div className="flex justify-between text-stone-600">
                      <span>Zwischensumme:</span>
                      <span className="font-mono">{formatCHF(selectedOrder.pricing.rawSubtotalCHF)}</span>
                    </div>
                    {selectedOrder.pricing.cartonDiscountCHF > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Rabatte:</span>
                        <span className="font-mono">-{formatCHF(selectedOrder.pricing.cartonDiscountCHF)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-500 text-[10px]">
                      <span>MwSt. (8.1% CH):</span>
                      <span className="font-mono">{formatCHF(selectedOrder.pricing.mwstCHF)}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1 border-t border-stone-200 font-bold text-stone-950 text-xs">
                      <span>Gesamtbetrag (CHF):</span>
                      <span className="font-mono text-sm text-wine-950">
                        {formatCHF(selectedOrder.pricing.finalTotalCHF)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <FileText className="w-10 h-10 mb-2 stroke-[1.5]" />
                <p className="text-xs">Wählen Sie eine Bestellung aus der Liste links aus, um den Beleg anzuzeigen.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => setIsOrderHistoryOpen(false)}
            className="py-2.5 px-6 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Schliessen
          </button>
        </div>
      </div>
    </div>
  );
};
