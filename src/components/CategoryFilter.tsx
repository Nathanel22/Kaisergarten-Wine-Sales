import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { WineCategory, WineFilterState } from '../types/wine';

interface CategoryFilterProps {
  filter: WineFilterState;
  onFilterChange: (newFilter: WineFilterState) => void;
  totalResultsCount: number;
}

const CATEGORIES: { id: WineCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'Alle Produkte', icon: '🍷' },
  { id: 'red', label: 'Rotweine', icon: '🍇' },
  { id: 'white', label: 'Weissweine', icon: '🥂' },
  { id: 'rose', label: 'Rosé', icon: '🌸' },
  { id: 'sparkling', label: 'Schaumweine', icon: '🍾' },
  { id: 'dessert', label: 'Dessertweine & Liköre', icon: '✨' },
  { id: 'spirits', label: 'Spirituosen', icon: '🥃' },
  { id: 'special', label: 'Weitere Artikel', icon: '◇' },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  filter,
  onFilterChange,
  totalResultsCount,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 p-4 md:p-5 mb-8">
      {/* Search and Sort row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Wein, Rebsorte, Jahrgang oder Region suchen..."
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-wine-600 focus:border-wine-600 transition-all placeholder:text-stone-400"
          />
          {filter.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-stone-400" />
          <label htmlFor="sort-select" className="text-xs font-medium text-stone-600 shrink-0">
            Sortierung:
          </label>
          <select
            id="sort-select"
            value={filter.sortBy}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                sortBy: e.target.value as WineFilterState['sortBy'],
              })
            }
            className="text-xs font-medium bg-stone-50 border border-stone-200 text-stone-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-wine-600 cursor-pointer"
          >
            <option value="featured">Empfehlung & Bestseller</option>
            <option value="price-asc">Preis: Aufsteigend</option>
            <option value="price-desc">Preis: Absteigend</option>
            <option value="name-asc">Name (A–Z)</option>
            <option value="vintage-desc">Jahrgang: Neueste</option>
          </select>
        </div>
      </div>

      {/* Category Pills (Touch-optimized for tablets) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = filter.category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onFilterChange({ ...filter, category: cat.id })}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'bg-wine-900 text-white shadow-md shadow-wine-950/15 font-semibold'
                  : 'bg-stone-100/80 text-stone-700 hover:bg-stone-200/80 border border-transparent hover:border-stone-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
        <div className="ml-auto pl-2 text-xs text-stone-500 font-medium whitespace-nowrap">
          {totalResultsCount} {totalResultsCount === 1 ? 'Wein' : 'Weine'} gefunden
        </div>
      </div>
    </div>
  );
};
