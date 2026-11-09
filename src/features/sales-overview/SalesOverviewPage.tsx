import { useCallback, useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { DEMO_SELLERS } from '../../config/demoSeller';
import { FAIR_CONFIGURATION, getDemoFairContext } from '../../config/fairContext';
import { ORDERS_STORAGE_KEY } from '../../utils/demoStorage';
import type { Order } from '../../types/order';
import { mapOverviewOrders } from './orderAdapter';
import { initializeDemoScenario, initializeDemoScenarioOnce, removeDemoScenario, SCENARIO_ID } from './demoScenario';
import { SalesOverview } from './SalesOverview';

export function SalesOverviewPage() {
  const { completedOrder } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const refresh = useCallback(() => {
    try {
      const stored = initializeDemoScenarioOnce();
      mapOverviewOrders(stored);
      setOrders(stored);
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Bestellspeicher nicht lesbar.'); }
  }, []);
  useEffect(() => { refresh(); }, [refresh, completedOrder]);
  useEffect(() => {
    const changed = (e: StorageEvent) => { if (e.key === ORDERS_STORAGE_KEY || e.key === null) refresh(); };
    window.addEventListener('storage', changed);
    window.addEventListener('focus', refresh);
    // Keep date filters current across midnight while the page remains open.
    const timer = window.setInterval(refresh, 60000);
    return () => { window.removeEventListener('storage', changed); window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [refresh]);
  const examples = orders.filter(o => o.demoScenario === SCENARIO_ID).length;
  function scenario(remove: boolean) {
    if (remove && !window.confirm('Nur die synthetischen Beispielbestellungen entfernen? Eigene Testbestellungen bleiben erhalten.')) return;
    try {
      const stored = remove ? removeDemoScenario() : initializeDemoScenario();
      mapOverviewOrders(stored);
      setOrders(stored); setError('');
      setMessage(remove ? 'Beispielszenario entfernt. Eigene Testbestellungen bleiben erhalten.'
        : 'Beispielszenario geladen. Vorhandene Bestellungen werden nicht überschrieben.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Beispielszenario konnte nicht gespeichert werden.'); }
  }
  const fairs = [...FAIR_CONFIGURATION.fairs.map(f => ({ id: f.id, name: f.name }))];
  for (const order of orders) {
    if (!fairs.some(f => f.id === order.fairId)) fairs.push({ id: order.fairId, name: order.fairName });
  }
  return <>
    {error ? <div role="alert" className="kgso-scenario"><p>{error}</p><button onClick={refresh}>Erneut laden</button></div>
      : <SalesOverview orders={mapOverviewOrders(orders)} sellers={[...DEMO_SELLERS]} fairs={fairs} defaultFairId={getDemoFairContext()?.fairId} />}
    <section className="kgso-scenario" aria-label="Demo-Beispielszenario">
      <h2 className="font-serif text-xl">Synthetisches Beispielszenario</h2>
      <p>6 Bestellungen · 48 Flaschen · 4 Demo-Verkäufer. Ausschliesslich lokale Testdaten mit DEMO-Preisen. Beim ersten Öffnen einmalig geladen, sofern der Bestellspeicher leer ist. Erneutes Laden nur ausdrücklich und bei leerem Speicher.</p>
      <button disabled={!!error || orders.length > 0} onClick={() => scenario(false)}>Beispielszenario laden</button>
      <button disabled={!!error || examples === 0} onClick={() => scenario(true)}>Beispieldaten entfernen</button>
      <p>{examples} Beispielbestellungen gespeichert. Eigene Testbestellungen bleiben beim Entfernen erhalten.</p>
      {message && <p role="status">{message}</p>}
    </section>
  </>;
}
