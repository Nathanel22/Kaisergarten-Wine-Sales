import { KpiCard } from './KpiCard';
import { formatChf, orderBottles, orderRappen } from './salesStats';
import type { OverviewOrder, OverviewStats, SellerStats } from './types';

const fmtTime = (iso: string) => new Date(iso).toLocaleString('de-CH', { timeZone: 'Europe/Zurich', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Detailansicht eines Verkäufers: nur Umsatz, Bestellungen, Flaschen. Keine Kundendaten, Provisionen oder Einkaufspreise. */
export function SellerDetail({ seller, total, onBack }: { seller: SellerStats; total: OverviewStats; onBack: () => void }) {
  const share = total.revenueRappen ? Math.round((seller.revenueRappen / total.revenueRappen) * 100) : 0;
  return (
    <div>
      <div className="kgso-head"><div><h2>{seller.name}</h2><p className="kgso-mu">Anteil am Gesamtumsatz: {share} %</p></div><button className="kgso-btn g" onClick={onBack}>Zurück zur Übersicht</button></div>
      <div className="kgso-kpis">
        <KpiCard label="Umsatz" value={formatChf(seller.revenueRappen)} />
        <KpiCard label="Bestellungen" value={String(seller.orders)} />
        <KpiCard label="Verkaufte Flaschen" value={String(seller.bottles)} />
      </div>
      <div className="kgso-card"><h3>Bestellungen</h3>
        {seller.orderList.length ? (
          <div className="kgso-table-scroll"><table><thead><tr><th>Nr.</th><th>Zeitpunkt</th><th className="n">Flaschen</th><th className="n">Betrag</th></tr></thead><tbody>
            {seller.orderList.map((o: OverviewOrder) => <tr key={o.id}><td><b>{o.id}</b>{o.example && <div className="kgso-small">Synthetisches Demo-Beispiel</div>}</td><td>{fmtTime(o.createdAt)}</td><td className="n">{orderBottles(o)}</td><td className="n">{formatChf(orderRappen(o))}</td></tr>)}
          </tbody></table></div>
        ) : <p className="kgso-mu">Noch keine Bestellungen in diesem Zeitraum.</p>}
      </div>
    </div>
  );
}
