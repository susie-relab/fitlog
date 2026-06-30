'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Activity, EXERCISE_TYPE_LABELS, EXERCISE_TYPE_COLORS } from '@/types';
import { formatDate } from '@/lib/utils';

export default function NotesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .not('notes', 'is', null)
      .neq('notes', '')
      .order('date', { ascending: false })
      .then(({ data }) => {
        setActivities((data as Activity[]) || []);
        setLoading(false);
      });
  }, [user]);

  const filtered = search
    ? activities.filter(a =>
        a.notes?.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase())
      )
    : activities;

  if (loading) return <div className="text-[#64748B] text-sm">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-1">Notes Log</h1>
      <p className="text-sm text-[#64748B] mb-4">Training diary — all activities with notes</p>

      <input
        type="text"
        className="input mb-5"
        placeholder="Search notes..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-[#64748B] text-sm">
            {search ? 'No notes match your search.' : 'No notes yet. Add notes when logging activities.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(a => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: EXERCISE_TYPE_COLORS[a.exercise_type] + '22',
                      color: EXERCISE_TYPE_COLORS[a.exercise_type],
                    }}
                  >
                    {EXERCISE_TYPE_LABELS[a.exercise_type]}
                  </span>
                  <span className="text-sm font-semibold text-white">{a.name}</span>
                </div>
                <span className="text-xs text-[#475569] whitespace-nowrap flex-shrink-0">{formatDate(a.date)}</span>
              </div>
              <p className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-line">{a.notes}</p>
              <div className="flex gap-3 mt-2 text-xs text-[#475569]">
                <span>{a.duration_minutes}m</span>
                {a.distance_km ? <span>{a.distance_km} km</span> : null}
                {a.pace_min_km ? <span>{Math.floor(a.pace_min_km)}:{String(Math.round((a.pace_min_km % 1) * 60)).padStart(2, '0')}/km</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
