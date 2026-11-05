import { Order, OrderItemSnapshot, OrderPricingSnapshot, CreateOrderParams, SaveOrderResult } from '../types/order';
import { validateCustomerData } from '../types/customer';
import { chfToRappen, rappenToCHF, roundRappen5 } from './formatters';

const ORDERS_STORAGE_KEY = 'kaisergarten_demo_orders_v1';

export interface OrderValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

/**
 * Erzeugt eine eindeutige Kennung für einen Bestellvorgang (Idempotency Key).
 * Dieser Key bleibt für die gesamte Checkout-Session stabil.
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

/**
 * Validiert sämtliche Bedingungen vor dem Erstellen einer Bestellung:
 * - Verbindliche 6er-Kartonregel für Wein
 * - Pflichtauswahl eines Verkäufers
 * - Gültige Messe- und Tabletzuordnung
 * - Vollständige, validierte Kundendaten
 */
export function validateOrderParams(params: CreateOrderParams): OrderValidationResult {
  const errors: string[] = [];

  // 1. Positionen prüfen
  if (!params.items || params.items.length === 0) {
    errors.push('Warenkorb ist leer');
  }

  let totalWineBottles = 0;
  for (const item of params.items) {
    if (typeof item.wine.priceCHF !== 'number' || !Number.isFinite(item.wine.priceCHF) || item.wine.priceCHF <= 0) {
      errors.push(`Preis noch nicht hinterlegt: ${item.wine.name}`);
    }
    if (item.wine.sourceId && (item.wine.cartonRule !== 'standard-6' || item.wine.caseSize !== 6)) {
      errors.push(`Gebinde und Bestellfreigabe noch nicht bestätigt: ${item.wine.name}`);
    }

    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      errors.push(`Ungültige Menge für Produkt "${item.wine.name}": ${item.quantity}`);
    }
    if (item.wine.cartonRule ? item.wine.cartonRule === 'standard-6' : !['special', 'spirits', 'dessert'].includes(item.wine.category)) {
      totalWineBottles += item.quantity;
    }
  }

  // 2. Verbindliche Kartonregel (Vielfaches von 6)
  if (totalWineBottles === 0) {
    errors.push('Bestellung muss mindestens 6 Flaschen Wein enthalten (Kartonregel).');
  } else if (totalWineBottles % 6 !== 0) {
    const missing = 6 - (totalWineBottles % 6);
    errors.push(
      `Verbindliche Kartonregel nicht erfüllt: Aktuell ${totalWineBottles} Weinflaschen. Es fehlen noch ${missing} Flasche(n) bis zum nächsten vollständigen 6er-Karton.`
    );
  }

  // 3. Verkäuferpflicht
  if (!params.seller || !params.seller.id?.trim() || !params.seller.name?.trim()) {
    errors.push('Ein Verkäufer muss der Bestellung zwingend zugewiesen sein.');
  }

  // 4. Messezuordnung
  if (
    !params.fairContext ||
    !params.fairContext.fairId?.trim() ||
    !params.fairContext.fairName?.trim() ||
    !params.fairContext.booth?.trim() ||
    !params.fairContext.tabletId?.trim()
  ) {
    errors.push('Gültige Messe-, Stand- und Tabletzuordnung ist für den Bestellabschluss erforderlich.');
  }

  // 5. Kundendaten validieren
  if (!params.customer) {
    errors.push('Kunde muss der Bestellung zugewiesen sein.');
  } else {
    const customerValidation = validateCustomerData(params.customer);
    if (!customerValidation.isValid) {
      for (const [field, msg] of Object.entries(customerValidation.errors)) {
        errors.push(`Kundenfeld "${field}": ${msg}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Erzeugt eine eindeutige Bestell-ID mit Datumspräfix.
 * Falls ein Idempotency-Key vorliegt, wird ein deterministischer Suffix gebildet,
 * damit wiederholte Aufrufe desselben Vorgangs dieselbe ID erzeugen.
 */
export function generateOrderId(now = new Date(), idempotencyKey?: string): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  return `KG-${yyyy}${mm}${dd}-${idempotencyKey || generateIdempotencyKey()}`;
}

/**
 * Formatiert Datum und Uhrzeit nach Schweizer Standard
 */
export function formatOrderDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy}, ${hh}:${min} Uhr`;
}

/**
 * Erstellt eine historisch gesicherte Bestellung mit exakten Rappenbeträgen.
 */
export function buildOrder(params: CreateOrderParams, customId?: string, customDate = new Date()): Order {
  const validation = validateOrderParams(params);
  if (!validation.isValid) {
    throw new Error(`Bestellung kann nicht erstellt werden:\n${validation.errors.join('\n')}`);
  }

  const idempotencyKey = params.idempotencyKey?.trim() || generateIdempotencyKey();

  const itemsSnapshot: OrderItemSnapshot[] = [];
  let rawSubtotalRappen = 0;
  let cartonDiscountRappen = 0;
  let totalBottles = 0;
  let totalWineBottles = 0;

  for (const item of params.items) {
    totalBottles += item.quantity;
    if (item.wine.cartonRule ? item.wine.cartonRule === 'standard-6' : !['special', 'spirits', 'dessert'].includes(item.wine.category)) {
      totalWineBottles += item.quantity;
    }

    const unitPriceRappen = chfToRappen(item.wine.priceCHF);
    const lineTotalRappen = unitPriceRappen * item.quantity;
    rawSubtotalRappen += lineTotalRappen;

    itemsSnapshot.push({
      wineId: item.wine.id,
      name: item.wine.name,
      vintage: item.wine.vintage,
      grapeVariety: item.wine.grapeVariety,
      bottleSizeCl: item.wine.bottleSizeCl,
      quantity: item.quantity,
      unitPriceRappen,
      unitPriceCHF: rappenToCHF(unitPriceRappen),
      lineTotalRappen,
      lineTotalCHF: rappenToCHF(lineTotalRappen),
    });

    // Demo-Kartonrabatt (unbestätigte Annahme): Differenz Einzelpreis x caseSize zu casePriceCHF
    const caseSize = item.wine.caseSize || 6;
    if (item.wine.casePriceCHF) {
      const fullCases = Math.floor(item.quantity / caseSize);
      const casePriceRappen = chfToRappen(item.wine.casePriceCHF);
      const expectedFullCaseRappen = unitPriceRappen * caseSize;
      const discountPerCase = Math.max(0, expectedFullCaseRappen - casePriceRappen);
      cartonDiscountRappen += fullCases * discountPerCase;
    }
  }

  // Demo-Messebonus ab 12 Flaschen (5% unbestätigte Annahme)
  let messeBonusRappen = 0;
  const subtotalAfterCases = rawSubtotalRappen - cartonDiscountRappen;
  if (totalBottles >= 12) {
    messeBonusRappen = Math.round(subtotalAfterCases * 0.05);
  }

  const totalDiscountRappen = cartonDiscountRappen + messeBonusRappen;
  const netSubtotalRappen = Math.max(0, rawSubtotalRappen - totalDiscountRappen);

  // Schweizer 5-Rappen-Rundung NUR auf den Zahlbetrag anwenden
  const finalTotalRappen = roundRappen5(netSubtotalRappen);
  const roundingDifferenceRappen = finalTotalRappen - netSubtotalRappen;

  // Inkludierte MwSt (8.1% CH)
  const mwstRappen = Math.round(finalTotalRappen - finalTotalRappen / 1.081);

  const pricingSnapshot: OrderPricingSnapshot = {
    rawSubtotalRappen,
    rawSubtotalCHF: rappenToCHF(rawSubtotalRappen),
    cartonDiscountRappen: totalDiscountRappen,
    cartonDiscountCHF: rappenToCHF(totalDiscountRappen),
    discountNote:
      totalDiscountRappen > 0
        ? 'Hinweis: Demo-Konditionen (Karton- und 5%-Messevorteil ab 12 Fl.) sind unbestätigte Annahmen.'
        : 'Keine Rabatte gewährt',
    netSubtotalRappen,
    netSubtotalCHF: rappenToCHF(netSubtotalRappen),
    finalTotalRappen,
    finalTotalCHF: rappenToCHF(finalTotalRappen),
    mwstRappen,
    mwstCHF: rappenToCHF(mwstRappen),
    roundingDifferenceRappen,
  };

  const orderId = customId || generateOrderId(customDate, idempotencyKey);

  return {
    id: orderId,
    idempotencyKey,
    createdAt: customDate.toISOString(),
    formattedDate: formatOrderDate(customDate),
    status: 'completed',
    fairId: params.fairContext.fairId,
    fairName: params.fairContext.fairName,
    booth: params.fairContext.booth,
    tabletId: params.fairContext.tabletId,
    sellerId: params.seller.id,
    sellerName: params.seller.name,
    sellerRole: params.seller.role,
    customer: { ...params.customer },
    items: itemsSnapshot,
    totalBottles,
    totalWineBottles,
    completeCases: Math.floor(totalWineBottles / 6),
    pricing: pricingSnapshot,
    notes: params.notes,
  };
}

/**
 * Prüft, ob zwei Bestellungen denselben fachlichen Inhalt haben.
 */
export function isOrderPayloadEqual(a: Order, b: Order): boolean {
  const payload = (order: Order) => ({
    fairId: order.fairId, fairName: order.fairName, booth: order.booth,
    tabletId: order.tabletId, sellerId: order.sellerId, sellerName: order.sellerName,
    sellerRole: order.sellerRole, customer: order.customer, items: order.items,
    pricing: order.pricing, notes: order.notes,
  });
  return JSON.stringify(payload(a)) === JSON.stringify(payload(b));
}

/**
 * Lädt die lokal im Browser gespeicherten Bestellungen
 */
export function loadStoredOrders(strict = false): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    throw new Error('Ungültiger Bestellspeicher');
  } catch (e) {
    if (strict) throw new Error('Bestellspeicher kann nicht sicher gelesen werden. Bitte erneut versuchen.');
    console.warn('Could not read demo orders from localStorage', e);
  }
  return [];
}

/**
 * Speichert eine Bestellung mit echter Idempotenz und bestätigter Verifikation.
 *
 * Regeln:
 * - Identischer Aufruf mit gleichem Key und gleichem Inhalt: Gibt bestehende Bestellung zurück (isDuplicate: true).
 * - Identischer Key mit abweichendem Inhalt: Wirft Idempotenz-Konflikt-Fehler.
 * - Bei Speicherfehler (z.B. localStorage-Quota): Wirft Fehler und meldet Misserfolg (Fehler B Behebung).
 * - Bestätigt nach dem Speichern das Vorhandensein im Storage.
 */
export function saveStoredOrder(order: Order): SaveOrderResult {
  const current = loadStoredOrders(true);

  // 1. Idempotenzprüfung anhand von id oder idempotencyKey
  const existing = current.find(
    (o) => o.id === order.id || (Boolean(o.idempotencyKey) && o.idempotencyKey === order.idempotencyKey)
  );

  if (existing) {
    // Prüfen, ob der Inhalt übereinstimmt
    if (isOrderPayloadEqual(existing, order)) {
      // Reines Duplikat / Retry: Erfolgreich vorhandene Bestellung zurückgeben
      return {
        success: true,
        order: existing,
        isDuplicate: true,
      };
    }

    // Konflikt: Derselbe Key für unterschiedliche Bestelldaten!
    throw new Error(
      `Idempotenz-Konflikt: Der Idempotency-Key "${order.idempotencyKey}" wurde bereits für eine andere Bestellung (${existing.id}) mit abweichendem Inhalt verwendet.`
    );
  }

  // 2. Neue Bestellung speichern
  const updated = [order, ...current];
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Fehler beim Speichern der Bestellung im lokalen Speicher: ${msg}`);
  }

  // 3. Verifikation: Prüfen, dass der Schreibvorgang tatsächlich erfolgreich war
  const verifiedOrders = loadStoredOrders(true);
  const verifiedOrder = verifiedOrders.find((o) => o.id === order.id);
  if (!verifiedOrder || !isOrderPayloadEqual(verifiedOrder, order)) {
    throw new Error(`Speicherverifikation fehlgeschlagen: Bestellung "${order.id}" konnte nach dem Speichern nicht bestätigt werden.`);
  }

  return {
    success: true,
    order: verifiedOrder,
    isDuplicate: false,
  };
}
