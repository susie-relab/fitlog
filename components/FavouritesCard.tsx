'use client';
import { Activity, allFavouriteItems, topActivityCounts, FavouriteItem } from '@/types';

interface Props {
  favourites: string[]; // keys from user_metadata.favourite_activities
  activities: Activity[];
}

/** Compact favourites + top-5 display for Dash — the full editor lives on Profile. */
export default function FavouritesCard({ favourites, activities }: Props) {
  const allItems = allFavouriteItems();
  const favItems = favourites.map(k => allItems.find(i => i.key === k)).filter(Boolean) as FavouriteItem[];
  const { topTypes, topSubtypes } = topActivityCounts(activities, 3);

  if (favItems.length === 0 && topTypes.length === 0) return null;

  return (
    <div className="card mb-5">
      {favItems.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Favourite Activities</p>
          <div className="flex flex-wrap gap-2">
            {favItems.map(i => (
              <span key={i.key} className="px-2.5 py-1.5 rounded-lg border border-[#334155] text-sm text-white">{i.emoji} {i.label}</span>
            ))}
          </div>
        </div>
      )}
      {(topTypes.length > 0 || topSubtypes.length > 0) && (
        <div className={favItems.length > 0 ? 'pt-3 border-t border-[#334155]' : ''}>
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Top 5 <span className="font-normal">(past 3 months)</span></p>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="flex flex-col gap-1">
              {topTypes.map(({ item, count }) => (
                <div key={item.key} className="flex items-center justify-between text-xs">
                  <span className="text-white truncate">{item.emoji} {item.label}</span>
                  <span className="text-[#64748B] flex-shrink-0 ml-2">{count}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              {topSubtypes.map(({ item, count }) => (
                <div key={item.key} className="flex items-center justify-between text-xs">
                  <span className="text-white truncate">{item.emoji} {item.label}</span>
                  <span className="text-[#64748B] flex-shrink-0 ml-2">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
