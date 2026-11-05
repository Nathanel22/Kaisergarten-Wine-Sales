import { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { WineCard } from './components/WineCard';
import { WineDetailModal } from './components/WineDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { TabletQuickBar } from './components/TabletQuickBar';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { CATALOG } from './data/catalog';
import { filterCatalog } from './utils/catalog';
import { WineFilterState } from './types/wine';
import { Wine as WineIcon, Search } from 'lucide-react';

export function App() {
  const [filter, setFilter] = useState<WineFilterState>({
    category: 'all',
    searchQuery: '',
    sortBy: 'featured',
  });

  const filteredWines = useMemo(() => filterCatalog(CATALOG, filter), [filter]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] pb-24 sm:pb-28">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
        {/* Hero & Promotion Showcase */}
        <HeroBanner />

        {/* Filter and Search Bar */}
        <CategoryFilter
          filter={filter}
          onFilterChange={setFilter}
          totalResultsCount={filteredWines.length}
        />

        <p className="text-sm text-stone-600 mb-5">Offizieller Produktkatalog · Preise und Gebinde werden noch bestätigt. Derzeit sind keine Artikel bestellbar.</p>

        {/* Wine Catalog Grid */}
        {filteredWines.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWines.map((wine) => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-xs max-w-lg mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-800 mb-2">
              Keine Weine gefunden
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Kein Treffer für „{filter.searchQuery}“. Versuchen Sie einen anderen Suchbegriff oder wählen Sie alle Kategorien.
            </p>
            <button
              onClick={() => setFilter({ category: 'all', searchQuery: '', sortBy: 'featured' })}
              className="px-5 py-2.5 rounded-xl bg-wine-900 text-white text-xs font-semibold hover:bg-wine-950 transition-colors"
            >
              Filter zurücksetzen
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white/80 py-8 px-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-serif font-semibold text-stone-800">
            <WineIcon className="w-4 h-4 text-wine-900" />
            <span>Kaisergarten Weine – Messeverkauf POS (Phase 2)</span>
          </div>
          <div className="text-stone-400 text-[11px]">
            Demo-Katalog & Bestellsystem • Rappen-Kalkulation • Schweizer 5-Rappen-Rundung
          </div>
          <div className="text-stone-400 text-[11px]">
            &copy; 2026 Kaisergarten Weine. Alle Rechte vorbehalten.
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <WineDetailModal />
      <CartDrawer />
      <TabletQuickBar />
      <CheckoutModal />
      <OrderSuccessModal />
      <OrderHistoryModal />
    </div>
  );
}

export default App;
