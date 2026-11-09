import { useMemo, useState } from 'react';
import './sales-overview.css';
import { KpiCard } from './KpiCard';
import { SellerBars } from './SellerBars';
import { SellerDetail } from './SellerDetail';
import { computeOverview, filterOrders, formatChf } from './salesStats';
import type { Metric, OverviewFair, OverviewOrder, OverviewSeller, Period } from './types';

const PERIODS: [Period, string][] = [['today', 'Heute'], ['week', 'Diese Woche'], ['month', 'Dieser Monat'], ['fair', 'Messe gesamt']];
const METRICS: [Metric, string][] = [['revenue', 'Umsatz'], ['orders', 'Bestellungen'], ['bottles', 'Flaschen']];

export interface SalesOverviewProps {
  /** Alle vorhandenen Bestellungen der App (keine eigene Datenhaltung). */
  orders: OverviewOrder[];
  sellers: OverviewSeller[];
  fairs: OverviewFair[];
  /** Vorgewählte Messe (z. B. Messe des aktuellen Tablets). Sonst „Alle Messen“. */
  defaultFairId?: string;
  /** Nur für Tests: feste Uhrzeit. */
  now?: Date;
  /** Zeigt den Demo-Hinweis. */
  demo?: boolean;
}

/** Verkaufsübersicht: Kennzahlen, Filter, Verkäufervergleich, Verkäufer-Detail. */
export function SalesOverview({ orders, sellers, fairs, defaultFairId, now, demo = true }: SalesOverviewProps) {
  const [period, setPeriod] = useState<Period>('fair');
  const [fairId, setFairId] = useState<string>(defaultFairId ?? 'all');
  const [metric, setMetric] = useState<Metric>('revenue');
  const [sel, setSel] = useState<string | null>(null);
  const ref = now ?? new Date();
  const stats = useMemo(() => computeOverview(filterOrders(orders, { fairId, period, now: ref }), sellers), [orders, sellers, fairId, period, ref.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps
  const seller = stats.sellers.find((s) => s.sellerId === sel);

  return (
    <section className="kgso">
      {demo && <div className="kgso-demo">LOKALE DEMO-AUSWERTUNG – nur dieser Browser. Keine Zusammenführung mehrerer Tablets. Simulierte Bestellungen mit gespeicherten Messe- oder DEMO-Preisen.</div>}
      {seller ? <SellerDetail seller={seller} total={stats} onBack={() => setSel(null)} /> : (
        <>
          <div className="kgso-head"><div><h2>Verkaufsübersicht</h2><p className="kgso-mu">Alle Zahlen werden live aus den vorhandenen Bestellungen berechnet. Zeiträume: Schweizer Zeit (Europe/Zurich).</p></div></div>
          <div className="kgso-filters">
            <div className="kgso-seg" role="group" aria-label="Zeitraum">{PERIODS.map(([k, l]) => <button key={k} className={`kgso-btn ${period === k ? 'on' : 'g'}`} aria-pressed={period === k} onClick={() => setPeriod(k)}>{l}</button>)}</div>
            <select aria-label="Messe" value={fairId} onChange={(e) => setFairId(e.target.value)}><option value="all">Alle Messen</option>{fairs.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
          </div>
          <div className="kgso-kpis">
            <KpiCard label="Gesamtumsatz" value={formatChf(stats.revenueRappen)} />
            <KpiCard label="Bestellungen" value={String(stats.orders)} />
            <KpiCard label="Verkaufte Flaschen" value={String(stats.bottles)} />
            <KpiCard label="Verkäufer mit Bestellung" value={`${stats.sellersWithOrders} von ${stats.sellerCount}`} />
          </div>
          <div className="kgso-card">
            <div className="kgso-head"><h3>Verkäufervergleich</h3>
              <div className="kgso-seg" role="group" aria-label="Balken zeigen">{METRICS.map(([k, l]) => <button key={k} className={`kgso-btn ${metric === k ? 'on' : 'g'}`} aria-pressed={metric === k} onClick={() => setMetric(k)}>{l}</button>)}</div></div>
            {stats.orders === 0 && <p className="kgso-mu">Für diese Auswahl gibt es noch keine Bestellungen.</p>}
            <SellerBars rows={stats.sellers} metric={metric} onSelect={setSel} />
          </div>
        </>
      )}
    </section>
  );
}
