import { formatChf, metricValue } from './salesStats';
import type { Metric, SellerStats } from './types';

/** Verkäufervergleich: Zeile = Verkäufer, Balken = gewählte Kennzahl. Ganze Zeile ist Touch-Fläche. */
export function SellerBars({ rows, metric, onSelect }: { rows: SellerStats[]; metric: Metric; onSelect: (id: string) => void }) {
  const max = Math.max(1, ...rows.map((r) => metricValue(r, metric)));
  return (
    <div className="kgso-bars">
      <div className="kgso-barhead" aria-hidden="true"><span>Verkäufer</span><span /><span className="n">Umsatz</span><span className="n">Bestellungen</span><span className="n">Flaschen</span></div>
      {rows.map((r) => (
        <button key={r.sellerId} className="kgso-bar" onClick={() => onSelect(r.sellerId)} aria-label={`${r.name} Details anzeigen`}>
          <span className="kgso-name">{r.name}</span>
          <span className="kgso-track"><span style={{ width: `${(metricValue(r, metric) / max) * 100}%` }} /></span>
          <span className="n">{formatChf(r.revenueRappen)}</span><span className="n">{r.orders}</span><span className="n">{r.bottles}</span>
        </button>
      ))}
    </div>
  );
}
