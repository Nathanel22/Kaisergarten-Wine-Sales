import { simulateCheckout } from '../utils/demoCheckout';
import React, { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { Customer } from '../types/customer';
import { loadStoredCustomers } from '../data/mockCustomers';
import { DEMO_SELLERS, Seller } from '../config/demoSeller';
import { getDemoFairContext } from '../config/fairContext';
import { generateIdempotencyKey } from '../utils/orderProcessing';
import { formatDemoCHF } from '../utils/formatters';
import {
  X,
  User,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  BadgeCheck,
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const fairContext = getDemoFairContext();
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    items,
    clearCart,
    activeSeller,
    setActiveSeller,
    summary,
    cartonValidation,
    setCompletedOrder,
  } = useCart();

  // Wizard Step: 1 = Kunde, 2 = Verkäufer, 3 = Prüfung & Abschluss
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Kunden-State
  const [customers] = useState<Customer[]>(() => loadStoredCustomers());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [sellerSelection, setChosenSeller] = useState<Seller | null>(null);
  const chosenSeller = sellerSelection ?? activeSeller;

  // Idempotenz / Doppelklick-Schutz
  const [checkoutSessionKey, setCheckoutSessionKey] = useState<string>(() => generateIdempotencyKey());
  const submissionLock = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isCheckoutOpen) return null;

  // Filter Kunden nach Suchbegriff
  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.id.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.firstName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  });

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleCompleteOrder = async () => {
    if (submissionLock.current) return; // Synchronous guard before React updates
    if (!selectedCustomer) {
      setSubmitError('Bitte wählen Sie zuerst einen Kunden aus.');
      setStep(1);
      return;
    }
    if (!chosenSeller) {
      setSubmitError('Bitte weisen Sie einen Verkäufer zu.');
      setStep(2);
      return;
    }
    if (!fairContext) {
      setSubmitError('Keine aktive Messekonfiguration vorhanden.');
      return;
    }
    if (!cartonValidation.canCheckout) {
      setSubmitError('Die verbindliche 6er-Kartonregel für Wein ist nicht erfüllt.');
      return;
    }

    try {
      submissionLock.current = true;
      setIsSubmitting(true);
      setSubmitError(null);

      const saveResult = simulateCheckout(items.map(i => ({ id: i.wine.id, quantity: i.quantity })),
        selectedCustomer.id, chosenSeller.id, checkoutSessionKey);
      if (!saveResult.success) {
        throw new Error(saveResult.errorMessage || 'Bestellung konnte im lokalen Speicher nicht verifiziert werden.');
      }

      // ERST NACH BESTÄTIGTER SPEICHERUNG:
      // Aktiven Verkäufer aktualisieren
      setActiveSeller(chosenSeller);

      // Warenkorb zurücksetzen
      clearCart();

      // Checkout-Modal schliessen und Erfolgsmodal öffnen
      setIsCheckoutOpen(false);
      setCompletedOrder(saveResult.order);

      // Neuen Key für den nächsten Bestellvorgang erzeugen
      setCheckoutSessionKey(generateIdempotencyKey());
      setSelectedCustomer(null);
      setStep(1);
      setChosenSeller(null);
    } catch (err: unknown) {
      // Bei Fehler: Warenkorb bleibt unverändert erhalten, kein Erfolgsmodal!
      const message = err instanceof Error ? err.message : 'Unerwarteter Fehler beim Bestellabschluss';
      setSubmitError(message);
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={() => !isSubmitting && setIsCheckoutOpen(false)} />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 max-h-[92vh] flex flex-col">
        {/* Header mit Schritt-Fortschritt */}
        <div className="bg-wine-950 text-white p-5 sm:p-6 border-b border-wine-900 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-300">
                Tablet POS · Bestellabschluss
              </span>
              <h2 className="font-serif text-2xl font-bold text-white">Bestellung simulieren</h2>
            </div>
            <button
              onClick={() => !isSubmitting && setIsCheckoutOpen(false)}
              disabled={isSubmitting}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-50"
              aria-label="Schliessen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => !isSubmitting && setStep(1)}
              className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                step === 1
                  ? 'bg-gold-500 text-stone-950 shadow-sm'
                  : selectedCustomer
                  ? 'bg-wine-900/80 text-gold-200 hover:bg-wine-900'
                  : 'bg-white/10 text-stone-300'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">
                {selectedCustomer ? '✓' : '1'}
              </span>
              <span>1. Kunde</span>
            </button>

            <button
              type="button"
              onClick={() => !isSubmitting && setStep(2)}
              className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                step === 2
                  ? 'bg-gold-500 text-stone-950 shadow-sm'
                  : chosenSeller
                  ? 'bg-wine-900/80 text-gold-200 hover:bg-wine-900'
                  : 'bg-white/10 text-stone-300'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">
                2
              </span>
              <span>2. Verkäufer</span>
            </button>

            <button
              type="button"
              onClick={() => !isSubmitting && selectedCustomer && setStep(3)}
              disabled={!selectedCustomer}
              className={`py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                step === 3
                  ? 'bg-gold-500 text-stone-950 shadow-sm'
                  : 'bg-white/10 text-stone-300 disabled:opacity-40'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">
                3
              </span>
              <span>3. Simulation prüfen</span>
            </button>
          </div>
        </div>

        {/* Fehlerbanner bei Bestellabschluss */}
        {submitError && (
          <div className="bg-red-50 border-b border-red-200 p-4 text-xs text-red-800 flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">Speicherfehler beim Bestellabschluss</p>
                <p className="mt-0.5 text-red-700">{submitError}</p>
                <p className="mt-1 text-[11px] text-red-600">
                  Der Warenkorb wurde nicht gelöscht. Sie können das Speichern gefahrlos wiederholen.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCompleteOrder}
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-xs shrink-0 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* SCHRITT 1: KUNDENAUSWAHL ODER NEUKUNDE */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">Bitte einen der synthetischen Beispielkunden auswählen.</p>
                <div className="space-y-3">
                  {/* Suchfeld */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Name, Ort, E-Mail, Telefon oder Kundennummer suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs sm:text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-800"
                    />
                  </div>

                  {/* Kundenliste */}
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                        <User className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                        <p className="font-semibold text-stone-700">Kein Kunde gefunden</p>
                        <p className="mt-1">
                          Erfassen Sie den Kunden einfach als Neukunden über den Reiter oben.
                        </p>
                      </div>
                    ) : (
                      filteredCustomers.map((cust) => {
                        const isChosen = selectedCustomer?.id === cust.id;
                        return (
                          <div
                            key={cust.id}
                            onClick={() => handleSelectCustomer(cust)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                              isChosen
                                ? 'bg-wine-50/60 border-wine-600 ring-2 ring-wine-600/20'
                                : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-sm text-stone-900">
                                  {cust.salutation} {cust.firstName} {cust.lastName}
                                </span>
                                {cust.company && (
                                  <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-medium">
                                    {cust.company}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-stone-600 mt-0.5">
                                {cust.street}, {cust.zip} {cust.city} ({cust.canton || 'CH'})
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-stone-500 font-mono mt-1">
                                <span>{cust.phone}</span>
                                <span>•</span>
                                <span className="truncate">{cust.email}</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0">
                              <span className="text-[10px] font-mono text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                                {cust.id}
                              </span>
                              {isChosen && (
                                <span className="mt-2 text-wine-900 font-bold text-xs flex items-center gap-1">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                  Ausgewählt
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
            </div>
          )}

          {/* SCHRITT 2: VERKÄUFERAUSWAHL (PFLICHTFELD) */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600">
                <p className="font-semibold text-stone-900">Zuständiger Sommelier / Verkäufer</p>
                <p className="mt-1">
                  Jede Bestellung muss eindeutig einem verantwortlichen Verkäufer zugewiesen sein. 
                  Mehrere Verkäufer können dasselbe Tablet benutzen. Der Verkäuferwechsel ändert 
                  die Tablet- und Messezuordnung nicht.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEMO_SELLERS.map((seller) => {
                  const isChosen = chosenSeller.id === seller.id;
                  return (
                    <div
                      key={seller.id}
                      onClick={() => setChosenSeller(seller)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isChosen
                          ? 'bg-wine-50/60 border-wine-600 ring-2 ring-wine-600/20'
                          : 'bg-white border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <p className="font-serif font-bold text-sm text-stone-900">{seller.name}</p>
                        <p className="text-xs text-stone-500">{seller.role}</p>
                        <span className="inline-block mt-1 text-[10px] font-mono text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                          ID: {seller.id}
                        </span>
                      </div>
                      {isChosen ? (
                        <div className="w-6 h-6 rounded-full bg-wine-900 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-stone-300" />
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* SCHRITT 3: PRÜFUNG & ABSCHLUSS */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              {/* Zusammenfassung Messe & Gerät */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-emerald-700" />
                    Messe- & Tabletkontext
                  </span>
                  <span className="font-mono text-stone-500">{fairContext?.tabletId}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-stone-600">
                  <div>
                    <span className="text-stone-400 block text-[10px]">Messe:</span>
                    <strong className="text-stone-800">{fairContext?.fairName}</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">Stand:</span>
                    <strong className="text-stone-800">{fairContext?.booth}</strong>
                  </div>
                </div>
              </div>

              {/* Zusammenfassung Kunde & Verkäufer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <span className="font-bold text-stone-800 block text-[10px] uppercase">
                    Kunde (Liefer- & Rechnungsadresse)
                  </span>
                  {selectedCustomer ? (
                    <div>
                      <p className="font-serif font-bold text-sm text-stone-900">
                        {selectedCustomer.salutation} {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </p>
                      {selectedCustomer.company && (
                        <p className="text-stone-600 text-[11px]">{selectedCustomer.company}</p>
                      )}
                      <p className="text-stone-600">
                        {selectedCustomer.street}, {selectedCustomer.zip} {selectedCustomer.city}
                      </p>
                      <p className="text-stone-500 font-mono text-[11px] mt-1">
                        {selectedCustomer.email} • {selectedCustomer.phone}
                      </p>
                    </div>
                  ) : (
                    <span className="text-red-600">Kein Kunde ausgewählt</span>
                  )}
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                  <span className="font-bold text-stone-800 block text-[10px] uppercase">
                    Verantwortlicher Verkäufer
                  </span>
                  <p className="font-serif font-bold text-sm text-stone-900">{chosenSeller.name}</p>
                  <p className="text-stone-600">{chosenSeller.role}</p>
                  <p className="text-stone-400 font-mono text-[11px]">ID: {chosenSeller.id}</p>
                </div>
              </div>

              {/* Kartonstatus Bestätigung */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Kartonregel erfüllt:</strong> {cartonValidation.statusMessage}.
                </span>
              </div>

              {/* Positionen-Tabelle */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <div className="bg-stone-100 p-2.5 font-bold text-stone-800 flex justify-between">
                  <span>Bestellte Weine ({summary.totalBottles} Flaschen)</span>
                  <span>Betrag CHF</span>
                </div>
                <div className="divide-y divide-stone-100 max-h-44 overflow-y-auto">
                  {items.map((i) => (
                    <div key={i.wine.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-stone-900">{i.wine.name}</span>
                        <span className="text-stone-500 font-mono ml-2">
                          {i.quantity} × {formatDemoCHF(i.wine.priceCHF)}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-stone-900">
                        {formatDemoCHF(i.wine.priceCHF * i.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Summenblock */}
                <div className="bg-stone-50 p-3 border-t border-stone-200 space-y-1.5">
                  <div className="flex justify-between text-stone-600">
                    <span>Zwischensumme:</span>
                    <span className="font-mono">{formatDemoCHF(summary.rawSubtotalCHF)}</span>
                  </div>
                  {summary.cartonDiscountCHF > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Messe- & Kartonvorteil (unbestätigte Annahme):</span>
                      <span className="font-mono">-{formatDemoCHF(summary.cartonDiscountCHF)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-500 text-[11px]">
                    <span>Enthaltene MwSt. (8.1% CH):</span>
                    <span className="font-mono">{formatDemoCHF(summary.mwstCHF)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 text-base font-bold text-stone-950">
                    <span className="font-serif">Gesamtbetrag (CHF):</span>
                    <span className="font-mono text-xl text-wine-950">
                      {formatDemoCHF(summary.finalTotalCHF)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rechtlicher Demo-Hinweis */}
              <div className="p-3 bg-stone-100 rounded-xl text-[11px] text-stone-500 space-y-1">
                <p>
                  <strong>Nur Simulation – keine Bestellung, Zahlung oder Lieferung. Ausschliesslich synthetische Beispielkunden.</strong> Geldbeträge werden intern in ganzzahligen Rappen geführt.
                  Die Schweizer 5-Rappen-Rundung wird auf den Zahlbetrag angewendet. 
                  Die Bestellung wird lokal im Browser-Speicher dieses Tablets gesichert.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          {step > 1 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Zurück</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsCheckoutOpen(false)}
              className="py-2.5 px-4 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 font-semibold text-xs transition-all disabled:opacity-50"
            >
              Abbrechen
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 1 && !selectedCustomer}
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="py-2.5 px-6 rounded-xl bg-wine-900 hover:bg-wine-950 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-40"
            >
              <span>Weiter</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || !cartonValidation.canCheckout || !selectedCustomer}
              onClick={handleCompleteOrder}
              className="py-3 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Wird abgeschlossen...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>Demo-Bestellung simulieren ({formatDemoCHF(summary.finalTotalCHF)})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
