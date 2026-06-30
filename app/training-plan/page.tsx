'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

type Period = 'week' | 'month' | 'quarter' | 'year';

interface Goal {
  id?: string;
  period: Period;
  target_runs?: number | null;
  target_distance_km?: number | null;
  target_minutes?: number | null;
  target_activities?: number | null;
}

const PERIODS: { value: Period; label: string; sublabel: string }[] = [
  { value: 'week', label: 'Weekly', sublabel: 'Resets every Monday' },
  { value: 'month', label: 'Monthly', sublabel: 'Resets 1st of each month' },
  { value: 'quarter', label: 'Quarterly', sublabel: 'Every 3 months' },
  { value: 'year', label: 'Yearly', sublabel: 'Jan–Dec' },
];

const empty = (period: Period): Goal => ({ period, target_runs: null, target_distance_km: null, target_minutes: null, target_activities: null });

export default function TrainingPlanPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Record<Period, Goal>>({
    week: empty('week'), month: empty('month'), quarter: empty('quarter'), year: empty('year'),
  });
  const [activePeriod, setActivePeriod] = useState<Period>('week');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('goals').select('*').eq('user_id', user.id).then(({ data }) => {
      if (data) {
        const map = { ...goals };
        for (const g of data) {
          map[g.period as Period] = g as Goal;
        }
        setGoals(map);
      }
      setLoading(false);
    });
  }, [user]);

  const goal = goals[activePeriod];

  const update = (field: keyof Goal, val: string) => {
    const num = val === '' ? null : parseInt(val) || parseFloat(val) || null;
    setGoals(prev => ({ ...prev, [activePeriod]: { ...prev[activePeriod], [field]: num } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from('goals')
      .upsert({ user_id: user!.id, ...goal }, { onConflict: 'user_id,period' })
      .select()
      .single();
    setSaving(false);
    if (!error && data) {
      setGoals(prev => ({ ...prev, [activePeriod]: data as Goal }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClear = async () => {
    const cleared = empty(activePeriod);
    setGoals(prev => ({ ...prev, [activePeriod]: cleared }));
    await supabase.from('goals').upsert(
      { user_id: user!.id, period: activePeriod, target_runs: null, target_distance_km: null, target_minutes: null, target_activities: null },
      { onConflict: 'user_id,period' }
    );
  };

  const hasGoals = (g: Goal) => g.target_runs || g.target_distance_km || g.target_minutes || g.target_activities;

  if (loading) return <div className="text-[#64748B] text-sm">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-white mb-1">Training Plan</h1>
      <p className="text-sm text-[#64748B] mb-5">Set targets to track on your Dash. All fields optional.</p>

      {/* Period tabs */}
      <div className="grid grid-cols-4 gap-1.5 mb-6">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setActivePeriod(p.value)}
            className={`py-2 rounded-lg text-sm font-semibold border transition-all relative ${
              activePeriod === p.value
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-[#334155] text-[#94A3B8] hover:border-[#475569]'
            }`}
          >
            {p.label}
            {hasGoals(goals[p.value]) && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-400" />
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-[#475569] mb-4">{PERIODS.find(p => p.value === activePeriod)?.sublabel}</p>

      <div className="card flex flex-col gap-4">
        <div>
          <label className="label">Target Runs</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 4"
            min="0"
            value={goal.target_runs ?? ''}
            onChange={e => update('target_runs', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Target Distance (km)</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 50"
            min="0"
            step="0.1"
            value={goal.target_distance_km ?? ''}
            onChange={e => update('target_distance_km', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Target Time (minutes)</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 300"
            min="0"
            value={goal.target_minutes ?? ''}
            onChange={e => update('target_minutes', e.target.value)}
          />
          {goal.target_minutes ? (
            <p className="text-xs text-[#475569] mt-1">
              = {Math.floor(goal.target_minutes / 60)}h {goal.target_minutes % 60}m
            </p>
          ) : null}
        </div>
        <div>
          <label className="label">Target Activities (any type)</label>
          <input
            type="number"
            className="input"
            placeholder="e.g. 6"
            min="0"
            value={goal.target_activities ?? ''}
            onChange={e => update('target_activities', e.target.value)}
          />
        </div>

        {saved && (
          <div className="p-3 rounded-lg bg-green-900/40 border border-green-700 text-green-300 text-sm">
            ✅ Goals saved!
          </div>
        )}

        <div className="flex gap-2 mt-1">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save Goals'}
          </button>
          {hasGoals(goal) && (
            <button onClick={handleClear} className="btn-secondary px-4 text-sm">Clear</button>
          )}
        </div>
      </div>

      {/* Summary of all goals */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">All Goals</h2>
        <div className="flex flex-col gap-2">
          {PERIODS.map(p => {
            const g = goals[p.value];
            if (!hasGoals(g)) return (
              <div key={p.value} className="flex items-center justify-between py-2 px-3 rounded-lg border border-[#334155]">
                <span className="text-sm text-[#475569]">{p.label}</span>
                <span className="text-xs text-[#334155]">No goals set</span>
              </div>
            );
            return (
              <div key={p.value} className="flex items-start justify-between py-2.5 px-3 rounded-lg border border-[#334155] bg-[#1E293B]">
                <span className="text-sm font-medium text-white">{p.label}</span>
                <div className="text-right flex flex-col gap-0.5">
                  {g.target_runs && <span className="text-xs text-blue-400">{g.target_runs} runs</span>}
                  {g.target_distance_km && <span className="text-xs text-blue-300">{g.target_distance_km} km</span>}
                  {g.target_minutes && <span className="text-xs text-[#94A3B8]">{Math.floor(g.target_minutes/60)}h {g.target_minutes%60}m</span>}
                  {g.target_activities && <span className="text-xs text-green-400">{g.target_activities} activities</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
