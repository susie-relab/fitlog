'use client';
import { useMemo, useState } from 'react';
import {
  Activity, YearTotalTile, DEFAULT_YEAR_TOTAL_TILES, MAX_YEAR_TOTAL_TILES,
  activityMatchesFavouriteKey, allFavouriteItems, FavouriteItem,
} from '@/types';

interface Props {
  activities: Activity[];
  config: YearTotalTile[] | undefined;
  onSave: (tiles: YearTotalTile[]) => void;
}

function tileValue(tile: YearTotalTile, yearActivities: Activity[]): number {
  const matches = yearActivities.filter(a => activityMatchesFavouriteKey(a, tile.key));
  return tile.metric === 'distance' ? matches.reduce((s, a) => s + (a.distance_km || 0), 0) : matches.length;
}

export default function YearTotalsCard({ activities, config, onSave }: Props) {
  const tiles = config ?? DEFAULT_YEAR_TOTAL_TILES;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<YearTotalTile[]>(tiles);
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const registry = useMemo(() => new Map(allFavouriteItems().map(i => [i.key, i] as [string, FavouriteItem])), []);
  const year = new Date().getFullYear();
  const yearActivities = useMemo(() => activities.filter(a => a.date >= `${year}-01-01`), [activities, year]);

  const startEditing = () => { setDraft(tiles); setEditing(true); };
  const cancelEditing = () => { setEditing(false); setPickedKey(null); setSearch(''); };
  const save = () => { onSave(draft); setEditing(false); setPickedKey(null); setSearch(''); };
  const removeTile = (key: string) => setDraft(prev => prev.filter(t => t.key !== key));
  const addTile = (key: string, metric: YearTotalTile['metric']) => {
    setDraft(prev => [...prev, { key, metric }]);
    setPickedKey(null);
    setSearch('');
  };

  const shown = editing ? draft : tiles;
  const usedKeys = new Set(draft.map(t => t.key));
  const pickableItems = allFavouriteItems().filter(i => !usedKeys.has(i.key) && i.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="card mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">This Year</h2>
        {editing ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#475569]">{draft.length}/{MAX_YEAR_TOTAL_TILES}</span>
            <button onClick={cancelEditing} className="text-xs text-[#64748B] hover:text-white">Cancel</button>
            <button onClick={save} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Save</button>
          </div>
        ) : (
          <button onClick={startEditing} aria-label="Edit This Year tiles" className="text-[#64748B] hover:text-white transition-colors text-sm">✏️</button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {shown.map(tile => {
          const item = registry.get(tile.key);
          const value = tileValue(tile, yearActivities);
          const displayValue = tile.metric === 'distance' ? `${value.toFixed(1)} km` : String(value);
          return (
            <div key={tile.key} className="stat-card relative">
              {editing && (
                <button
                  onClick={() => removeTile(tile.key)}
                  aria-label={`Remove ${item?.label ?? tile.key}`}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#334155] text-[#94A3B8] hover:bg-red-900/60 hover:text-red-300 flex items-center justify-center text-xs leading-none"
                >
                  ✕
                </button>
              )}
              <div className="stat-value">{displayValue}</div>
              <div className="stat-label">{item?.emoji} {item?.label ?? tile.key}</div>
            </div>
          );
        })}

        {editing && draft.length < MAX_YEAR_TOTAL_TILES && (
          <AddTileButton onOpen={() => setPickedKey('')} />
        )}
      </div>

      {editing && pickedKey !== null && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPickedKey(null)} />
          <div className="relative w-full md:max-w-md max-h-[80vh] flex flex-col bg-[#1E293B] border border-[#334155] rounded-t-2xl md:rounded-2xl p-5">
            {!pickedKey ? (
              <>
                <h3 className="text-lg font-bold text-white mb-3">Add a tile</h3>
                <input
                  autoFocus
                  className="input mb-3"
                  placeholder="Search sport or activity..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div className="overflow-y-auto flex-1 flex flex-col gap-1 -mx-1 px-1">
                  {pickableItems.map(item => (
                    <button
                      key={item.key}
                      onClick={() => setPickedKey(item.key)}
                      className="flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-[#293548] text-sm text-white"
                    >
                      <span>{item.emoji}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                  {pickableItems.length === 0 && <p className="text-sm text-[#64748B] px-3 py-2">No matches.</p>}
                </div>
                <button onClick={() => setPickedKey(null)} className="text-sm text-[#64748B] hover:text-white py-1 mt-3">Close</button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white mb-1">{registry.get(pickedKey)?.emoji} {registry.get(pickedKey)?.label}</h3>
                <p className="text-sm text-[#94A3B8] mb-4">What should this tile total?</p>
                <div className="flex flex-col gap-2">
                  <button onClick={() => addTile(pickedKey, 'distance')} className="btn-secondary text-sm py-2.5">Total distance (km)</button>
                  <button onClick={() => addTile(pickedKey, 'count')} className="btn-secondary text-sm py-2.5">Activity count</button>
                </div>
                <button onClick={() => setPickedKey('')} className="text-sm text-[#64748B] hover:text-white py-1 mt-3">← Back</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddTileButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="stat-card border-dashed flex flex-col items-center justify-center text-[#64748B] hover:text-white hover:border-[#475569] transition-colors">
      <span className="text-xl leading-none">+</span>
      <span className="text-xs mt-1">Add</span>
    </button>
  );
}
